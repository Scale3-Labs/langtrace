import { calculateTotalTime, convertTracesToHierarchy } from "./trace_utils";
import { calculatePriceFromUsage } from "./utils";

export interface Trace {
  id: string;
  status: string;
  session_id: string;
  type: string;
  namespace: string;
  user_ids: string[];
  prompt_ids: string[];
  prompt_versions: string[];
  models: string[];
  vendors: string[];
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
  total_duration: number;
  all_events: any[];
  sorted_trace: any[];
  trace_hierarchy: any[];
  raw_attributes: any;
  cleanlab_tlm_score?: number;
}

interface TraceAttributes {
  sessionId: string;
  vendor: string;
  userId: string | undefined;
  promptId: string | undefined;
  promptVersion: string | undefined;
  model: string;
  type: string;
  llmPrompts?: string;
  llmResponses?: string;
  tokenUsage: {
    promptTokens?: number;
    completionTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
    totalTokens?: number;
  };
  llmTokenCounts?: any;
}

function parseTraceAttributes(attributesStr: string): TraceAttributes {
  const attrs = JSON.parse(attributesStr);
  return {
    sessionId: attrs["session.id"] || "",
    vendor: (attrs["langtrace.service.name"] || "").toLowerCase(),
    userId: attrs["user_id"],
    promptId: attrs["prompt_id"],
    promptVersion: attrs["prompt_version"],
    model:
      attrs["gen_ai.response.model"] ||
      attrs["llm.model"] ||
      attrs["gen_ai.request.model"] ||
      "",
    type: attrs["langtrace.service.type"] || "session",
    llmPrompts: attrs["llm.prompts"],
    llmResponses: attrs["llm.responses"],
    tokenUsage: {
      promptTokens: Number(attrs["gen_ai.usage.prompt_tokens"]) || 0,
      completionTokens: Number(attrs["gen_ai.usage.completion_tokens"]) || 0,
      inputTokens: Number(attrs["gen_ai.usage.input_tokens"]) || 0,
      outputTokens: Number(attrs["gen_ai.usage.output_tokens"]) || 0,
      cachedTokens: Number(attrs["gen_ai.usage.cached_tokens"]) || 0,
    },
    llmTokenCounts: attrs["llm.token.counts"]
      ? JSON.parse(attrs["llm.token.counts"])
      : undefined,
  };
}

function processTokenCounts(
  currentCounts: any,
  attrs: TraceAttributes,
  vendor: string,
  model: string
): { tokenCounts: any; cost: any } {
  let tokenCounts = { ...currentCounts };
  let cost = { total: 0, input: 0, output: 0, cached_input: 0 };

  if (attrs.tokenUsage.promptTokens && attrs.tokenUsage.completionTokens) {
    tokenCounts = {
      input_tokens:
        (tokenCounts.input_tokens || 0) + attrs.tokenUsage.promptTokens,
      cached_input_tokens:
        (tokenCounts.cached_input_tokens || 0) +
        (attrs.tokenUsage.cachedTokens || 0),
      output_tokens:
        (tokenCounts.output_tokens || 0) + attrs.tokenUsage.completionTokens,
      total_tokens:
        (tokenCounts.total_tokens || 0) +
        attrs.tokenUsage.promptTokens +
        attrs.tokenUsage.completionTokens +
        (attrs.tokenUsage.cachedTokens || 0),
    };
  } else if (attrs.tokenUsage.inputTokens || attrs.tokenUsage.outputTokens) {
    tokenCounts = {
      input_tokens:
        (tokenCounts.input_tokens || 0) + attrs.tokenUsage.inputTokens,
      cached_input_tokens:
        (tokenCounts.cached_input_tokens || 0) +
        (attrs.tokenUsage.cachedTokens || 0),
      output_tokens:
        (tokenCounts.output_tokens || 0) + attrs.tokenUsage.outputTokens,
      total_tokens:
        (tokenCounts.total_tokens || 0) +
        attrs.tokenUsage.inputTokens +
        attrs.tokenUsage.outputTokens +
        (attrs.tokenUsage.cachedTokens || 0),
    };
  } else if (attrs.llmTokenCounts) {
    tokenCounts = {
      input_tokens:
        (tokenCounts.input_tokens || 0) + attrs.llmTokenCounts.input_tokens,
      cached_input_tokens:
        (tokenCounts.cached_input_tokens || 0) +
        attrs.llmTokenCounts.cached_tokens,
      output_tokens:
        (tokenCounts.output_tokens || 0) + attrs.llmTokenCounts.output_tokens,
      total_tokens:
        (tokenCounts.total_tokens || 0) + attrs.llmTokenCounts.total_tokens,
    };
  }

  const currentCost = calculatePriceFromUsage(vendor, model, tokenCounts);
  cost.total += currentCost.total;
  cost.input += currentCost.input;
  cost.output += currentCost.output;
  cost.cached_input += currentCost.cached_input;

  return { tokenCounts, cost };
}

function processEvents(events: string): {
  messages: Record<string, string[]>[];
  allEvents: any[];
} {
  if (!events || events === "[]") {
    return { messages: [], allEvents: [] };
  }

  const parsedEvents = JSON.parse(events);
  const inputs: string[] = [];
  const outputs: string[] = [];

  const promptEvent = parsedEvents.find(
    (event: any) => event.name === "gen_ai.content.prompt"
  );
  if (promptEvent?.attributes?.["gen_ai.prompt"]) {
    inputs.push(promptEvent.attributes["gen_ai.prompt"]);
  }

  const responseEvent = parsedEvents.find(
    (event: any) => event.name === "gen_ai.content.completion"
  );
  if (responseEvent?.attributes?.["gen_ai.completion"]) {
    outputs.push(responseEvent.attributes["gen_ai.completion"]);
  }

  const messages: Record<string, string[]>[] = [];
  if (inputs.length > 0 || outputs.length > 0) {
    messages.push({ prompts: inputs, responses: outputs });
  }

  return { messages, allEvents: [parsedEvents] };
}

export function processTrace(trace: any): Trace {
  if (!trace?.length) {
    throw new Error("Invalid trace data");
  }

  const traceHierarchy = convertTracesToHierarchy(trace);
  const totalTime = calculateTotalTime(trace);
  const startTime = trace[0].start_time;

  // Initialize collectors
  const uniqueModels = new Set<string>();
  const uniqueVendors = new Set<string>();
  const userIds: string[] = [];
  const promptIds: string[] = [];
  const promptVersions: string[] = [];
  const messages: Record<string, string[]>[] = [];
  const allEvents: any[] = [];
  let cleanlab_tlm_score: number | undefined;

  let tokenCounts: any = {};
  let totalCost = { total: 0, input: 0, output: 0, cached_input: 0 };
  let type = "session";
  let session_id = "";
  let lastParsedAttributes: any = {};

  // Check for error status
  const status = trace.some(
    (span: any) =>
      span.status_code === "ERROR" || span.status_code === "STATUS_CODE_ERROR"
  )
    ? "error"
    : "success";

  // Process each span
  for (const span of trace) {
    if (!span.attributes) continue;

    const attrs = parseTraceAttributes(span.attributes);
    lastParsedAttributes = JSON.parse(span.attributes); // Keep for backward compatibility

    // Check for CleanLab trustworthiness score
    if (
      attrs.vendor === "cleanlab" &&
      lastParsedAttributes["tlm.trustworthiness_score"]
    ) {
      cleanlab_tlm_score = lastParsedAttributes["tlm.trustworthiness_score"];
    }

    // Update collectors
    session_id = attrs.sessionId || session_id;
    type = attrs.type || type;

    if (attrs.vendor) uniqueVendors.add(attrs.vendor);
    if (attrs.model) uniqueModels.add(attrs.model);
    if (attrs.userId) userIds.push(attrs.userId);
    if (attrs.promptId) promptIds.push(attrs.promptId);
    if (attrs.promptVersion) promptVersions.push(attrs.promptVersion);

    // Process token counts and costs
    const { tokenCounts: newTokenCounts, cost } = processTokenCounts(
      tokenCounts,
      attrs,
      attrs.vendor,
      attrs.model
    );
    tokenCounts = newTokenCounts;
    totalCost.total += cost.total;
    totalCost.input += cost.input;
    totalCost.output += cost.output;
    totalCost.cached_input += cost.cached_input;

    // Process messages
    if (attrs.llmPrompts || attrs.llmResponses) {
      messages.push({
        prompts: attrs.llmPrompts ? [attrs.llmPrompts] : [],
        responses: attrs.llmResponses ? [attrs.llmResponses] : [],
      });
    }

    // Process events
    if (span.events) {
      const { messages: eventMessages, allEvents: newEvents } = processEvents(
        span.events
      );
      messages.push(...eventMessages);
      allEvents.push(...newEvents);
    }
  }

  // Sort trace by time
  trace.sort((a: any, b: any) => {
    if (a.start_time === b.start_time) {
      return a.end_time < b.end_time ? 1 : -1;
    }
    return a.start_time < b.start_time ? -1 : 1;
  });

  // Construct and return result
  return {
    id: trace[0]?.trace_id,
    type,
    status,
    session_id,
    namespace: traceHierarchy[0].name,
    user_ids: userIds,
    prompt_ids: promptIds,
    prompt_versions: promptVersions,
    models: Array.from(uniqueModels),
    vendors: Array.from(uniqueVendors),
    inputs: messages,
    outputs: messages,
    all_events: allEvents,
    input_tokens: tokenCounts.input_tokens,
    output_tokens: tokenCounts.output_tokens,
    cached_input_tokens: tokenCounts.cached_input_tokens,
    total_tokens: tokenCounts.total_tokens,
    input_cost: totalCost.input,
    cached_input_cost: totalCost.cached_input,
    output_cost: totalCost.output,
    total_cost: totalCost.total,
    total_duration: totalTime,
    start_time: startTime,
    sorted_trace: trace,
    trace_hierarchy: traceHierarchy,
    raw_attributes: lastParsedAttributes,
    cleanlab_tlm_score,
  };
}
