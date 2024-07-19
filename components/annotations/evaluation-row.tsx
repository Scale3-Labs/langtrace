import { HoverCell } from "@/components/shared/hover-cell";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import detectPII from "@/lib/pii";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { cn, formatDateTime } from "@/lib/utils";
import { Evaluation, Test } from "@prisma/client";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";
import { ProgressCircle } from "@tremor/react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import ConversationView from "../shared/conversation-view";
import { ScaleType } from "./eval-scale-picker";
import { RangeScale } from "./range-scale";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function EvaluationRow({
  key,
  span,
  projectId,
  tests,
  onCheckedChange,
  selectedData,
  selectedSpan,
  setSelectedSpan,
}: {
  key: number;
  span: any;
  projectId: string;
  tests: Test[];
  onCheckedChange: (data: CheckedData, checked: boolean) => void;
  selectedData: CheckedData[];
  setSelectedSpan: (spanId: string) => void;
  selectedSpan?: string;
}) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>();
  const [addedToDataset, setAddedToDataset] = useState(false);
  const [open, setOpen] = useState(false);

  useQuery({
    queryKey: ["fetch-evaluation-query", span?.span_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/evaluation?spanId=${span?.span_id}&projectId=${projectId}&includeTest=true`
      );
      const result = await response.json();
      setEvaluations(result.evaluations.length > 0 ? result.evaluations : []);
      return result;
    },
  });

  useQuery({
    queryKey: ["fetch-data-query", span.span_id],
    queryFn: async () => {
      const response = await fetch(`/api/data?spanId=${span.span_id}`);
      const result = await response.json();
      setAddedToDataset(result.data.length > 0);
      return result;
    },
    refetchOnMount: false,
  });

  const attributes = span.attributes ? JSON.parse(span.attributes) : {};
  if (!attributes) return null;

  // extract the metrics
  const userScore = evaluations ? evaluations[0]?.userScore || "" : "";
  const userId = evaluations ? evaluations[0]?.userId || "" : "";
  let prompts = [];
  let responses = [];
  if (span.events) {
    const events: any[] = JSON.parse(span.events);

    // find event with name 'gen_ai.content.prompt'
    const promptEvent = events.find(
      (event: any) => event.name === "gen_ai.content.prompt"
    );
    if (
      promptEvent &&
      promptEvent["attributes"] &&
      promptEvent["attributes"]["gen_ai.prompt"]
    ) {
      prompts.push(promptEvent["attributes"]["gen_ai.prompt"]);
    }

    // find event with name 'gen_ai.content.completion'
    const responseEvent = events.find(
      (event: any) => event.name === "gen_ai.content.completion"
    );
    if (
      responseEvent &&
      responseEvent["attributes"] &&
      responseEvent["attributes"]["gen_ai.completion"]
    ) {
      responses.push(responseEvent["attributes"]["gen_ai.completion"]);
    }
  }

  if ("llm.prompts" in attributes && "llm.responses" in attributes) {
    // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
    prompts = attributes["llm.prompts"];
    responses = attributes["llm.responses"];
  }

  let model = "";
  model =
    attributes["gen_ai.response.model"] ||
    attributes["gen_ai.request.model"] ||
    attributes["llm.model"] ||
    "";

  // check for pii detections
  let piiDetected = false;
  for (const prompt of JSON.parse(prompts)) {
    if (detectPII(prompt.content || "").length > 0) {
      piiDetected = true;
      break;
    }
  }
  piiDetected =
    piiDetected ||
    (responses &&
      detectPII(
        JSON.parse(responses)[0]?.message?.content ||
          JSON.parse(responses)[0]?.text ||
          JSON.parse(responses)[0]?.content ||
          ""
      ).length > 0);

  return (
    <tr
      key={key}
      onClick={() => {
        setOpen(true);
        setSelectedSpan(span.span_id);
      }}
      className={cn(
        "rounded-md hover:bg-muted w-full hover:cursor-pointer",
        selectedSpan === span.span_id ? "bg-muted" : ""
      )}
    >
      <td>
        <div
          className="flex flex-row items-center gap-2"
          // onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={span.span_id}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(state: boolean) => {
              const input = JSON.parse(prompts).find(
                (prompt: any) => prompt.role === "user"
              );
              if (!input) return;
              let output =
                responses?.length > 0
                  ? JSON.parse(responses)[0]?.message?.content ||
                    JSON.parse(responses)[0]?.text ||
                    JSON.parse(responses)[0]?.content
                  : "";

              // if output is object, convert to string
              if (typeof output === "object") {
                output = JSON.stringify(output);
              }

              const checkedData = {
                spanId: span.span_id,
                input: input?.content || "",
                output: output,
              };
              onCheckedChange(checkedData, state);
            }}
            checked={selectedData.some((d) => d.spanId === span.span_id)}
          />
          <p className="text-xs text-muted-foreground font-semibold">
            {formatDateTime(correctTimestampFormat(span.start_time))}
          </p>
        </div>
      </td>
      <td className="text-xs font-medium">{model}</td>
      <td>
        <HoverCell
          className="h-10 w-48 overflow-hidden truncate text-xs font-semibold"
          values={prompts?.length > 0 ? JSON.parse(prompts) : []}
        />
      </td>
      <td>
        <HoverCell
          className="w-48 overflow-hidden truncate h-10 text-xs font-semibold"
          values={responses?.length > 0 ? JSON.parse(responses) : []}
        />
      </td>
      <td>
        <div className="flex flex-row gap-0 items-center font-semibold">
          {piiDetected ? (
            <DotFilledIcon className="text-red-600 w-6 h-6" />
          ) : (
            <DotFilledIcon className="text-green-600 w-6 h-6" />
          )}
          <p className="text-xs">{piiDetected ? "Yes" : "No"}</p>
        </div>
      </td>
      {tests.map((test: Test, i) => {
        const evaluation = evaluations?.find((e) => e.testId === test.id);
        return (
          <td key={i} className="text-xs font-semibold text-center">
            {evaluation ? evaluation.ltUserScore : "Not evaluated"}
          </td>
        );
      })}
      <td className="text-xs font-semibold text-center">
        {userScore ? userScore : "Not evaluated"}
      </td>
      <td className="text-xs font-semibold">{userId || "Not available"}</td>
      <td className="flex justify-center h-full">
        {addedToDataset ? (
          <CheckCircledIcon className="text-green-600 w-5 h-5" />
        ) : (
          <CrossCircledIcon className="text-muted-foreground w-5 h-5" />
        )}
      </td>
      <div className="w-full">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
            className={cn("w-2/3 overflow-y-scroll")}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetHeader>
              <SheetTitle>Evaluate</SheetTitle>
              <SheetDescription>
                Evaluate the input and output of this LLM request.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-row gap-2 mt-4 justify-between">
              <div className="relative w-1/2 min-w-1/2">
                <ConversationView span={span} />
              </div>
              <div className="w-1/2 min-w-1/2 flex flex-col gap-4">
                {tests.map((test: Test, i) => {
                  const evaluation = evaluations?.find(
                    (e) => e.testId === test.id
                  );
                  return (
                    <EvaluateTest
                      key={i}
                      test={test}
                      span={span}
                      projectId={projectId}
                      evaluation={evaluation}
                    />
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </tr>
  );
}

function EvaluateTest({
  test,
  span,
  projectId,
  evaluation,
}: {
  test: Test;
  projectId: string;
  span: any;
  evaluation?: Evaluation;
}) {
  const [score, setScore] = useState(0);
  const [color, setColor] = useState("red");
  const [scorePercent, setScorePercent] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (evaluation && evaluation.ltUserScore) {
      setScore(evaluation.ltUserScore);
      onScoreSelected(test, evaluation.ltUserScore);
    }
  }, []);

  const onScoreSelected = (test: Test, value: number, submit = false) => {
    setScore(value);

    // Calculate the percentage of the score using min, max and step
    if (!test) return;
    const max = test?.max || 0;
    const min = test?.min || 0;
    const range = max - min;
    const scorePercent = ((value - min) / range) * 100;
    setScorePercent(scorePercent);

    if (scorePercent < 33) {
      setColor("red");
    }
    if (scorePercent >= 33 && scorePercent < 66) {
      setColor("yellow");
    }
    if (scorePercent >= 66) {
      setColor("green");
    }
    if (submit) {
      evaluate(value);
    }
  };

  const evaluate = async (value: number) => {
    try {
      const attributes = span?.attributes ? JSON.parse(span.attributes) : {};
      if (Object.keys(attributes).length === 0) return;

      // Check if an evaluation already exists
      if (evaluation) {
        if (evaluation.ltUserScore === value) {
          return;
        }
        // Update the existing evaluation
        await fetch("/api/evaluation", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: evaluation.id,
            ltUserScore: value,
            testId: test.id,
          }),
        });
        await queryClient.invalidateQueries({
          queryKey: ["fetch-evaluation-query", span?.span_id],
        });
      } else {
        // Create a new evaluation
        await fetch("/api/evaluation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: projectId,
            spanId: span.span_id,
            traceId: span.trace_id,
            ltUserScore: value,
            testId: test.id,
          }),
        });
        await queryClient.invalidateQueries({
          queryKey: ["fetch-evaluation-query", span?.span_id],
        });
      }
    } catch (error: any) {
      toast.error("Error evaluating the span!", {
        description: `There was an error evaluating the span: ${error.message}`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-start">
          <h2 className="text-lg font-semibold break-normal capitalize">
            {test?.name || "No name provided"}
          </h2>
          <ProgressCircle
            value={scorePercent}
            size="xs"
            color={color}
            className="relative"
          >
            <p className="text-lg font-semibold">{score}</p>
          </ProgressCircle>
        </div>
        <p className="text-sm w-3/4 text-muted-foreground">
          {test?.description || "No description provided"}
        </p>
      </div>
      <RangeScale
        variant="md"
        type={ScaleType.Range}
        min={test?.min || 0}
        max={test?.max || 0}
        step={test?.step || 0}
        selectedValue={score}
        onSelectedValueChange={(value) => onScoreSelected(test, value, true)}
      />
    </div>
  );
}
