import { Run } from "@prisma/client";

export interface RunScore {
  scorer: string;
  metrics: {
    name: string;
    value: string;
  }[];
}

export interface RunError {
  message: string;
  traceback: string;
}

export interface SampleScore {
  scorer: string;
  value: string;
  explanation: string;
}

export interface SampleMessage {
  role: string;
  content: string;
  source: string;
}

export interface RunSample {
  input: string;
  target: string;
  output: string;
  messages: SampleMessage[];
  scores: SampleScore[];
}

export interface RunView {
  id: string;
  start_at: string;
  completed_at: string;
  dataset_id?: string;
  status: string;
  model: string;
  samples: RunSample[];
  plan: {
    name: string;
    steps: string[];
  };
  logs: object;
  scores: RunScore[];
  error?: RunError;
}

export function processRun(run: Run): RunView {
  try {
    const id = run.id;
    const rawLogs: any = run.log || {};
    const logs = JSON.parse(rawLogs);
    const started_at = logs?.stats?.started_at || "";
    const completed_at = logs?.stats?.completed_at || "";
    const dataset_id = run.datasetId || "";
    const status = logs?.status || "unknown";
    const model = logs?.eval?.model || "model-unspecified";
    const scores: RunScore[] = [];
    const rawScores = logs?.results?.scores || [];
    for (const score of rawScores) {
      const scorer = score?.scorer || "unknown";
      const metrics = [] as RunScore["metrics"];
      const metricNames = Object.keys(score?.metrics) || [];
      for (const name of metricNames) {
        const metric: any = score?.metrics[name];
        metrics.push({
          name: name,
          value: metric?.value?.toString() || "unknown",
        });
      }
      scores.push({
        scorer,
        metrics,
      });
    }

    const samples = [];
    const logsSamples = logs?.samples || [];
    for (const sample of logsSamples) {
      const rawOutput = sample.output;
      let output = "";
      if (rawOutput?.choices) {
        const choice = rawOutput?.choices[0];
        const content = choice?.message?.content || "";
        if (typeof content === "string") {
          output = content;
        }
        if (typeof content === "object") {
          output = content[0]?.text || "";
        }
      }

      const messages: SampleMessage[] = [];
      for (const message of sample?.messages) {
        const role = message?.role || "unknown";
        const source = message?.source || "unknown";
        const rawContent = message?.content;
        if (typeof rawContent === "string") {
          messages.push({
            role,
            content: rawContent,
            source,
          });
          continue;
        }
        if (typeof rawContent === "object") {
          const content = rawContent[0]?.text || "";
          messages.push({
            role,
            content,
            source,
          });
        }
      }

      const scores: SampleScore[] = [];
      for (const key of Object.keys(sample?.scores)) {
        const scorer = key;
        const value = sample?.scores[key]?.value || "";
        const explanation = sample?.scores[key]?.explanation || "";
        scores.push({
          scorer,
          value,
          explanation,
        });
      }

      samples.push({
        input: sample.input,
        target: sample.target,
        output,
        messages,
        scores,
      });
    }
    const error = logs?.error || null;

    const rawPlan = logs?.plan || {};
    const plan = {
      name: "",
      steps: [],
    };
    if (rawPlan) {
      const name = rawPlan?.name || "unknown";
      const rawSteps = rawPlan?.steps || [];
      const steps = rawSteps.map((step: any) => step?.solver || "unknown");
      plan.name = name;
      plan.steps = steps;
    }

    const result: RunView = {
      id,
      start_at: started_at,
      completed_at,
      dataset_id,
      status,
      model,
      logs,
      samples,
      scores,
      plan,
      error,
    };
    return result;
  } catch (error) {
    return {
      id: run.id,
      start_at: "",
      completed_at: "",
      status: "error",
      model: "",
      logs: {},
      samples: [],
      scores: [],
      plan: {
        name: "",
        steps: [],
      },
      error: {
        message: "Failed to process the run",
        traceback: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
