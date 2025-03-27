import {
  calculateTotalTime,
  convertTracesToHierarchy,
  correctTimestampFormat,
} from "./trace_utils";
import { calculatePriceFromUsage, formatDateTime } from "./utils";
import { ToolCall } from "./trace_util";

export interface CrewAITrace {
  id: string;
  type: string;
  session_id: string;
  status: string;
  crew: CrewAICrew;
  agents: CrewAIAgent[];
  tasks: CrewAITask[];
  tools: CrewAITool[];
  memory: CrewAIMemory[];
  namespace: string;
  user_ids: string[];
  prompt_ids: string[];
  prompt_versions: string[];
  models: string[];
  vendors: string[];
  libraries: VendorMetadata[];
  inputs: Record<string, string[]>[];
  outputs: Record<string, string[]>[];
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: number;
  cached_input_cost: number;
  output_cost: number;
  total_cost: number;
  start_time: number;
  formatted_start_time: string;
  total_duration: number;
  all_events: any[];
  sorted_trace: any[];
  trace_hierarchy: any[];
  raw_attributes: any;
  tool_calls: ToolCall[];
}

export interface CrewAICrew {
  id: string;
  name: string;
  result: any;
  process: string;
  memory: number;
  verbose: boolean;
  cache: boolean;
  planning: boolean;
  share_crew: boolean;
  config?: string;
  manager_llm?: string;
  manager_agent?: string;
  function_calling_llm?: string;
  prompt_file?: string;
  max_rpm?: number;
  planning_llm?: string;
  embedder?: string;
  execution_logs?: string;
}

export interface CrewAIAgent {
  id: string;
  role: string;
  goal: string;
  backstory: string;
  llm: string;
  result: any;
  max_iter: number;
  max_retry_limit: number;
  allow_code_execution: boolean;
  allow_delegation: boolean;
  cache: boolean;
  verbose: boolean;
  tools?: CrewAITool[];
}

export interface CrewAITask {
  id: string;
  description: string;
  human_input: string;
  expected_output: string;
  result: any;
  agent: string;
  async_execution: boolean;
  delegations: number;
  used_tools: number;
  tool_errors: number;
  tools?: CrewAITool[];
}

export interface CrewAITool {
  name: string;
  description: string;
}

export interface CrewAIMemory {
  inputs: string;
  outputs: string;
}
export interface VendorMetadata {
  name: string;
  version: string;
}

export function processCrewAITrace(trace: any): CrewAITrace {
  const traceHierarchy = convertTracesToHierarchy(trace);
  const totalTime = calculateTotalTime(trace);
  const startTime = trace[0].start_time;
  let session_id = "";
  let tokenCounts: any = {};
  let models: string[] = [];
  let vendors: string[] = [];
  let libraries: VendorMetadata[] = [];
  let userIds: string[] = [];
  let promptIds: string[] = [];
  let promptVersions: string[] = [];
  let messages: Record<string, string[]>[] = [];
  let allEvents: any[] = [];
  let attributes: any = {};
  let cost = { total: 0, input: 0, output: 0, cached_input: 0 };
  let crew = {} as CrewAICrew;
  let agents: CrewAIAgent[] = [];
  let tasks: CrewAITask[] = [];
  let crewTools: CrewAITool[] = [];
  const memory: CrewAIMemory[] = [];
  let type: string = "session";
  // set status to ERROR if any span has an error
  let status = "success";
  for (const span of trace) {
    if (
      span.status_code === "ERROR" ||
      span.status_code === "STATUS_CODE_ERROR"
    ) {
      status = "error";
      break;
    }
  }

  for (const span of trace) {
    if (span.attributes) {
      // parse the attributes of the span
      attributes = JSON.parse(span.attributes);
      let vendor = "";
      let vendorVersion = "";

      // get the type of the span
      if (attributes["langtrace.service.type"]) {
        type = attributes["langtrace.service.type"];
      }

      // get the service name from the attributes
      if (attributes["langtrace.service.name"]) {
        vendor = attributes["langtrace.service.name"].toLowerCase();
        vendorVersion = attributes["langtrace.service.version"];
        if (!vendors.includes(vendor)) {
          vendors.push(vendor);
          libraries.push({ name: vendor, version: vendorVersion });
        }
      }

      // get the session_id from the attributes
      if (attributes["session.id"]) {
        session_id = attributes["session.id"];
      }

      // get the crew
      if (attributes["crewai.crew.id"]) {
        crew = {
          id: attributes["crewai.crew.id"] || "",
          name: attributes["crewai.crew.name"] || "",
          result: attributes["crewai.crew.result"] || "",
          process: attributes["crewai.crew.process"] || "",
          memory: attributes["crewai.crew.memory"] || 0,
          verbose: attributes["crewai.crew.verbose"] || false,
          cache: attributes["crewai.crew.cache"] || false,
          planning: attributes["crewai.crew.planning"] || false,
          share_crew: attributes["crewai.crew.share_crew"] || false,
          config: attributes["crewai.crew.config"] || "",
          manager_llm: attributes["crewai.crew.manager_llm"] || "",
          manager_agent: attributes["crewai.crew.manager_agent"] || "",
          function_calling_llm:
            attributes["crewai.crew.function_calling_llm"] || "",
          prompt_file: attributes["crewai.crew.prompt_file"] || "",
          max_rpm: attributes["crewai.crew.max_rpm"] || 0,
          planning_llm: attributes["crewai.crew.planning_llm"] || "",
          embedder: attributes["crewai.crew.embedder"] || "",
          execution_logs: attributes["crewai.crew.execution_logs"] || "",
        };
      }

      // get the agents
      if (attributes["crewai.agent.id"]) {
        const agent: CrewAIAgent = {
          id: attributes["crewai.agent.id"] || "",
          role: attributes["crewai.agent.role"] || "",
          goal: attributes["crewai.agent.goal"] || "",
          backstory: attributes["crewai.agent.backstory"] || "",
          llm: attributes["crewai.agent.llm"] || "",
          result: attributes["crewai.agent.result"] || "",
          max_iter: attributes["crewai.agent.max_iter"] || 0,
          max_retry_limit: attributes["crewai.agent.max_retry_limit"] || 0,
          allow_code_execution:
            attributes["crewai.agent.allow_code_execution"] || false,
          allow_delegation:
            attributes["crewai.agent.allow_delegation"] || false,
          cache: attributes["crewai.agent.cache"] || false,
          verbose: attributes["crewai.agent.verbose"] || false,
        };

        let tools = attributes["crewai.agent.tools"];
        try {
          tools = JSON.parse(tools);
        } catch (e) {
          tools = [];
        }
        if (tools.length > 0) {
          agent.tools = tools.map((tool: any) => {
            return {
              name: tool.name,
              description: tool.description,
            } as CrewAITool;
          });
          crewTools = [...(agent.tools as CrewAITool[])];
        }

        agents.push(agent);
      }

      // get the tasks
      if (attributes["crewai.task.id"]) {
        const task: CrewAITask = {
          id: attributes["crewai.task.id"] || "",
          description: attributes["crewai.task.description"] || "",
          human_input: attributes["crewai.task.human_input"] || "",
          expected_output: attributes["crewai.task.expected_output"] || "",
          result: attributes["crewai.task.result"] || "",
          agent: attributes["crewai.task.agent"] || "",
          async_execution: attributes["crewai.task.async_execution"] || false,
          delegations: attributes["crewai.task.delegations"] || 0,
          used_tools: attributes["crewai.task.used_tools"] || 0,
          tool_errors: attributes["crewai.task.tool_errors"] || 0,
        };
        let tools = attributes["crewai.task.tools"];
        try {
          tools = JSON.parse(tools);
        } catch (e) {
          tools = [];
        }
        if (tools.length > 0) {
          task.tools = tools.map((tool: any) => {
            return {
              name: tool.name,
              description: tool.description,
            };
          });
        }

        tasks.push(task);
      }

      if (attributes["crewai.memory.storage.rag_storage.inputs"]) {
        const memo: CrewAIMemory = {
          inputs: attributes["crewai.memory.storage.rag_storage.inputs"],
          outputs:
            attributes["crewai.memory.storage.rag_storage.outputs"] || "",
        };
        memo.inputs = memo.inputs.replace(/\\n/g, "\n");
        memo.outputs = memo.outputs.replace(/\\n/g, "\n");
        memory.push(memo);
      }

      // get the user_id, prompt_id, prompt_version, and model from the attributes
      if (attributes["user_id"]) {
        userIds.push(attributes["user_id"]);
      }
      if (attributes["prompt_id"]) {
        promptIds.push(attributes["prompt_id"]);
      }
      if (attributes["prompt_version"]) {
        promptVersions.push(attributes["prompt_version"]);
      }

      let model = "";
      if (
        attributes["gen_ai.response.model"] ||
        attributes["llm.model"] ||
        attributes["gen_ai.request.model"]
      ) {
        model =
          attributes["gen_ai.response.model"] ||
          attributes["llm.model"] ||
          attributes["gen_ai.request.model"];
        models.push(model);
      }
      // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
      if (attributes["llm.prompts"] && attributes["llm.responses"]) {
        const message = {
          prompt: attributes["llm.prompts"],
          response: attributes["llm.responses"],
        };
        messages.push(message);
      }

      if (
        attributes["gen_ai.usage.prompt_tokens"] &&
        attributes["gen_ai.usage.completion_tokens"]
      ) {
        tokenCounts = {
          input_tokens: tokenCounts.input_tokens
            ? tokenCounts.input_tokens +
              Number(attributes["gen_ai.usage.prompt_tokens"])
            : Number(attributes["gen_ai.usage.prompt_tokens"]),
          cached_input_tokens: tokenCounts.cached_input_tokens
            ? tokenCounts.cached_input_tokens +
              Number(attributes["gen_ai.usage.cached_tokens"] || 0)
            : Number(attributes["gen_ai.usage.cached_tokens"] || 0),
          output_tokens: tokenCounts.output_tokens
            ? tokenCounts.output_tokens +
              Number(attributes["gen_ai.usage.completion_tokens"])
            : Number(attributes["gen_ai.usage.completion_tokens"]),
          total_tokens: tokenCounts.total_tokens
            ? tokenCounts.total_tokens +
              Number(attributes["gen_ai.usage.prompt_tokens"]) +
              Number(attributes["gen_ai.usage.completion_tokens"]) +
              Number(attributes["gen_ai.usage.cached_tokens"] || 0)
            : Number(attributes["gen_ai.usage.prompt_tokens"]) +
              Number(attributes["gen_ai.usage.completion_tokens"]) +
              Number(attributes["gen_ai.usage.cached_tokens"] || 0),
        };

        // calculate the cost of the current span
        const currentcost = calculatePriceFromUsage(vendor, model, tokenCounts);

        // add the cost of the current span to the total cost
        cost.total += currentcost.total;
        cost.input += currentcost.input;
        cost.output += currentcost.output;
        cost.cached_input += currentcost.cached_input;
      } else if (
        attributes["gen_ai.usage.input_tokens"] &&
        attributes["gen_ai.usage.output_tokens"]
      ) {
        tokenCounts = {
          input_tokens: tokenCounts.input_tokens
            ? tokenCounts.input_tokens +
              Number(attributes["gen_ai.usage.input_tokens"])
            : Number(attributes["gen_ai.usage.input_tokens"]),
          cached_input_tokens: tokenCounts.cached_input_tokens
            ? tokenCounts.cached_input_tokens +
              Number(attributes["gen_ai.usage.cached_tokens"] || 0)
            : Number(attributes["gen_ai.usage.cached_tokens"] || 0),
          output_tokens: tokenCounts.output_tokens
            ? tokenCounts.output_tokens +
              Number(attributes["gen_ai.usage.output_tokens"])
            : Number(attributes["gen_ai.usage.output_tokens"]),
          total_tokens: tokenCounts.total_tokens
            ? tokenCounts.total_tokens +
              Number(attributes["gen_ai.usage.input_tokens"]) +
              Number(attributes["gen_ai.usage.output_tokens"]) +
              Number(attributes["gen_ai.usage.cached_tokens"] || 0)
            : Number(attributes["gen_ai.usage.input_tokens"]) +
              Number(attributes["gen_ai.usage.output_tokens"]) +
              Number(attributes["gen_ai.usage.cached_tokens"] || 0),
        };
        const currentcost = calculatePriceFromUsage(vendor, model, tokenCounts);
        // add the cost of the current span to the total cost
        cost.total += currentcost.total;
        cost.input += currentcost.input;
        cost.output += currentcost.output;
        cost.cached_input += currentcost.cached_input;
      } else if (attributes["llm.token.counts"]) {
        // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
        const currentcounts = JSON.parse(attributes["llm.token.counts"]);
        tokenCounts = {
          input_tokens: tokenCounts.input_tokens
            ? tokenCounts.input_tokens + currentcounts.input_tokens
            : currentcounts.input_tokens,
          cached_input_tokens: tokenCounts.cached_input_tokens
            ? tokenCounts.cached_input_tokens +
              currentcounts.cached_input_tokens
            : currentcounts.cached_input_tokens,
          output_tokens: tokenCounts.output_tokens
            ? tokenCounts.output_tokens + currentcounts.output_tokens
            : currentcounts.output_tokens,
          total_tokens: tokenCounts.total_tokens
            ? tokenCounts.total_tokens + currentcounts.total_tokens
            : currentcounts.total_tokens,
        };

        // calculate the cost of the current span
        const currentcost = calculatePriceFromUsage(
          vendor,
          model,
          currentcounts
        );
        // add the cost of the current span to the total cost
        cost.total += currentcost.total;
        cost.input += currentcost.input;
        cost.output += currentcost.output;
        cost.cached_input += currentcost.cached_input;
      }
    }

    // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
    const message: Record<string, string[]> = {
      prompts: [],
      responses: [],
    };

    if (attributes["llm.prompts"]) {
      message.prompts.push(attributes["llm.prompts"]);
    }

    if (attributes["llm.responses"]) {
      message.responses.push(attributes["llm.responses"]);
    }

    if (message.prompts.length > 0 || message.responses.length > 0) {
      messages.push(message);
    }

    if (span.events && span.events !== "[]") {
      const events = JSON.parse(span.events);
      const inputs = [];
      const outputs = [];
      allEvents.push(events);

      // find event with name 'gen_ai.content.prompt'
      const promptEvent = events.find(
        (event: any) => event.name === "gen_ai.content.prompt"
      );
      if (
        promptEvent &&
        promptEvent["attributes"] &&
        promptEvent["attributes"]["gen_ai.prompt"]
      ) {
        inputs.push(promptEvent["attributes"]["gen_ai.prompt"]);
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
        outputs.push(responseEvent["attributes"]["gen_ai.completion"]);
      }

      const message: Record<string, string[]> = {
        prompts: [],
        responses: [],
      };
      if (inputs.length > 0) {
        message.prompts.push(...inputs);
      }
      if (outputs.length > 0) {
        message.responses.push(...outputs);
      }
      if (message.prompts.length > 0 || message.responses.length > 0) {
        messages.push(message);
      }
    }
  }

  // Sort the trace based on start_time, then end_time
  trace.sort((a: any, b: any) => {
    if (a.start_time === b.start_time) {
      return a.end_time < b.end_time ? 1 : -1;
    }
    return a.start_time < b.start_time ? -1 : 1;
  });

  // construct the response object
  const result: CrewAITrace = {
    id: trace[0]?.trace_id,
    type: type,
    session_id: session_id,
    status: status,
    namespace: traceHierarchy[0].name,
    crew: crew,
    agents: agents,
    tasks: tasks,
    tools: crewTools,
    memory: memory,
    user_ids: userIds,
    prompt_ids: promptIds,
    prompt_versions: promptVersions,
    models: models,
    vendors: vendors,
    libraries: libraries,
    inputs: messages,
    outputs: messages,
    all_events: allEvents,
    input_tokens: tokenCounts.input_tokens,
    cached_input_tokens: tokenCounts.cached_input_tokens,
    output_tokens: tokenCounts.output_tokens,
    total_tokens: tokenCounts.total_tokens,
    input_cost: cost.input,
    output_cost: cost.output,
    cached_input_cost: cost.cached_input,
    total_cost: cost.total,
    total_duration: totalTime,
    start_time: startTime,
    formatted_start_time: formatDateTime(
      correctTimestampFormat(startTime),
      true
    ),
    sorted_trace: trace,
    trace_hierarchy: traceHierarchy,
    raw_attributes: attributes,
    tool_calls: [],
  };

  return result;
}
