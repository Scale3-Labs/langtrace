import { calculateTotalTime, convertTracesToHierarchy } from "./trace_utils";
import { calculatePriceFromUsage } from "./utils";

export interface Trace {
  status: string;
  namespace: string;
  user_ids: string[];
  prompt_ids: string[];
  prompt_versions: string[];
  models: string[];
  vendors: string[];
  inputs: Record<string, string[]>[];
  outputs: Record<string, string[]>[];
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
  start_time: number;
  total_duration: number;
  all_events: any[];
  sorted_trace: any[];
  trace_hierarchy: any[];
  raw_attributes: any;
}

export function processTrace(trace: any): Trace {
  const traceHierarchy = convertTracesToHierarchy(trace);
  const totalTime = calculateTotalTime(trace);
  const startTime = trace[0].start_time;
  let tokenCounts: any = {};
  let models: string[] = [];
  let vendors: string[] = [];
  let userIds: string[] = [];
  let promptIds: string[] = [];
  let promptVersions: string[] = [];
  let messages: Record<string, string[]>[] = [];
  let allEvents: any[] = [];
  let attributes: any = {};
  let cost = { total: 0, input: 0, output: 0 };
  // set status to ERROR if any span has an error
  let status = "success";
  for (const span of trace) {
    if (span.status === "ERROR") {
      status = "error";
      break;
    }
  }

  for (const span of trace) {
    if (span.attributes) {
      // parse the attributes of the span
      attributes = JSON.parse(span.attributes);
      let vendor = "";

      // get the service name from the attributes
      if (attributes["langtrace.service.name"]) {
        vendor = attributes["langtrace.service.name"].toLowerCase();
        vendors.push(vendor);
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
          input_tokens: tokenCounts.prompt_tokens
            ? tokenCounts.prompt_tokens +
              attributes["gen_ai.usage.prompt_tokens"]
            : attributes["gen_ai.usage.prompt_tokens"],
          output_tokens: tokenCounts.completion_tokens
            ? tokenCounts.completion_tokens +
              attributes["gen_ai.usage.completion_tokens"]
            : attributes["gen_ai.usage.completion_tokens"],
          total_tokens: tokenCounts.total_tokens
            ? tokenCounts.total_tokens +
              attributes["gen_ai.usage.prompt_tokens"] +
              attributes["gen_ai.usage.completion_tokens"]
            : attributes["gen_ai.usage.prompt_tokens"] +
              attributes["gen_ai.usage.completion_tokens"],
        };

        // calculate the cost of the current span
        const currentcost = calculatePriceFromUsage(vendor, model, tokenCounts);

        // add the cost of the current span to the total cost
        cost.total += currentcost.total;
        cost.input += currentcost.input;
        cost.output += currentcost.output;
      } else if (attributes["llm.token.counts"]) {
        // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
        const currentcounts = JSON.parse(attributes["llm.token.counts"]);
        tokenCounts = {
          input_tokens: tokenCounts.input_tokens
            ? tokenCounts.input_tokens + currentcounts.input_tokens
            : currentcounts.input_tokens,
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
      }
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
      } else {
        message.prompts.push("[{}]");
      }
      if (outputs.length > 0) {
        message.responses.push(...outputs);
      } else {
        message.responses.push("[{}]");
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
  const result: Trace = {
    status: status,
    namespace: traceHierarchy[0].name,
    user_ids: userIds,
    prompt_ids: promptIds,
    prompt_versions: promptVersions,
    models: models,
    vendors: vendors,
    inputs: messages,
    outputs: messages,
    all_events: allEvents,
    input_tokens: tokenCounts.input_tokens,
    output_tokens: tokenCounts.output_tokens,
    total_tokens: tokenCounts.total_tokens,
    input_cost: cost.input,
    output_cost: cost.output,
    total_cost: cost.total,
    total_duration: totalTime,
    start_time: startTime,
    sorted_trace: trace,
    trace_hierarchy: traceHierarchy,
    raw_attributes: attributes,
  };

  return result;
}
