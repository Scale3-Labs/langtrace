import { calculateTotalTime, convertTracesToHierarchy } from "./trace_utils";
import { calculatePriceFromUsage } from "./utils";

export interface ToolCall {
  id: string;
  type: string;
  name: string;
  arguments: string;
  timestamp?: number;
  count?: number;
}

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
  tool_calls: ToolCall[];
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

  const tokenUsage = attrs.tokenUsage || {};

  if (tokenUsage.promptTokens || tokenUsage.completionTokens) {
    tokenCounts = {
      input_tokens:
        (tokenCounts.input_tokens || 0) + Number(tokenUsage.promptTokens || 0),
      cached_input_tokens:
        (tokenCounts.cached_input_tokens || 0) +
        Number(tokenUsage.cachedTokens || 0),
      output_tokens:
        (tokenCounts.output_tokens || 0) +
        Number(tokenUsage.completionTokens || 0),
      total_tokens:
        (tokenCounts.total_tokens || 0) +
        Number(tokenUsage.promptTokens || 0) +
        Number(tokenUsage.completionTokens || 0) +
        Number(tokenUsage.cachedTokens || 0),
    };
  } else if (tokenUsage.inputTokens || tokenUsage.outputTokens) {
    tokenCounts = {
      input_tokens:
        (tokenCounts.input_tokens || 0) + Number(tokenUsage.inputTokens || 0),
      cached_input_tokens:
        (tokenCounts.cached_input_tokens || 0) +
        Number(tokenUsage.cachedTokens || 0),
      output_tokens:
        (tokenCounts.output_tokens || 0) + Number(tokenUsage.outputTokens || 0),
      total_tokens:
        (tokenCounts.total_tokens || 0) +
        Number(tokenUsage.inputTokens || 0) +
        Number(tokenUsage.outputTokens || 0) +
        Number(tokenUsage.cachedTokens || 0),
    };
  } else if (attrs.llmTokenCounts) {
    const llmCounts = attrs.llmTokenCounts || {};
    tokenCounts = {
      input_tokens:
        (tokenCounts.input_tokens || 0) + Number(llmCounts.input_tokens || 0),
      cached_input_tokens:
        (tokenCounts.cached_input_tokens || 0) +
        Number(llmCounts.cached_tokens || 0),
      output_tokens:
        (tokenCounts.output_tokens || 0) + Number(llmCounts.output_tokens || 0),
      total_tokens:
        (tokenCounts.total_tokens || 0) + Number(llmCounts.total_tokens || 0),
    };
  }

  const currentCost = calculatePriceFromUsage(vendor, model, tokenCounts);
  cost.total += currentCost.total;
  cost.input += currentCost.input;
  cost.output += currentCost.output;
  cost.cached_input += currentCost.cached_input;

  return { tokenCounts, cost };
}

function extractToolCalls(events: string, timestamp: number): ToolCall[] {
  if (!events || events === "[]") {
    return [];
  }

  try {
    const parsedEvents = JSON.parse(events);
    if (!Array.isArray(parsedEvents)) {
      return [];
    }

    const allToolCalls: ToolCall[] = [];

    for (const event of parsedEvents) {
      if (!event?.attributes) continue;

      if (
        event.name === "gen_ai.content.prompt" &&
        event.attributes["gen_ai.prompt"]
      ) {
        try {
          const promptHistory = JSON.parse(event.attributes["gen_ai.prompt"]);
          if (Array.isArray(promptHistory)) {
            for (const message of promptHistory) {
              if (message?.tool_calls && Array.isArray(message.tool_calls)) {
                message.tool_calls.forEach((tool: any) => {
                  if (tool?.function?.name && tool?.function?.arguments) {
                    allToolCalls.push({
                      id: tool.id || "",
                      type: tool.type || "function",
                      name: tool.function.name,
                      arguments: tool.function.arguments,
                      timestamp,
                      count: 1,
                    });
                  }
                });
              }
            }
          }
        } catch (e) {
          console.error("Error parsing prompt history:", e);
        }
      }

      if (
        event.name === "gen_ai.content.completion" &&
        event.attributes["gen_ai.completion"]
      ) {
        try {
          const completion = JSON.parse(event.attributes["gen_ai.completion"]);
          if (!completion) continue;

          const messages = Array.isArray(completion)
            ? completion
            : [completion];

          for (const message of messages) {
            if (!message) continue;

            if (message.tool_calls && Array.isArray(message.tool_calls)) {
              message.tool_calls.forEach((tool: any) => {
                if (tool?.function?.name && tool?.function?.arguments) {
                  allToolCalls.push({
                    id: tool.id || "",
                    type: tool.type || "function",
                    name: tool.function.name,
                    arguments: tool.function.arguments,
                    timestamp,
                    count: 1,
                  });
                }
              });
            }

            if (
              message.function_call?.name &&
              message.function_call?.arguments
            ) {
              allToolCalls.push({
                id: message.id || "",
                type: "function",
                name: message.function_call.name,
                arguments: message.function_call.arguments,
                timestamp,
                count: 1,
              });
            }

            if (typeof message.content === "string") {
              try {
                const parsedContent = JSON.parse(message.content);
                if (Array.isArray(parsedContent)) {
                  parsedContent.forEach((item: any) => {
                    if (item?.function?.name && item?.function?.arguments) {
                      allToolCalls.push({
                        id: item.id || "",
                        type: item.type || "function",
                        name: item.function.name,
                        arguments: item.function.arguments,
                        timestamp,
                        count: 1,
                      });
                    }
                  });
                }
              } catch (e) {
              }
            }
          }
        } catch (e) {
          console.error("Error parsing completion:", e);
        }
      }
    }

    return allToolCalls.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } catch (e) {
    console.error("Error parsing events:", e);
    return [];
  }
}

function processEvents(events: string, timestamp: number): {
  messages: Record<string, string[]>[];
  allEvents: any[];
  toolCalls: ToolCall[];
} {
  if (!events || events === "[]") {
    return { messages: [], allEvents: [], toolCalls: [] };
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

  const toolCalls = extractToolCalls(events, timestamp);

  return { messages, allEvents: [parsedEvents], toolCalls };
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
  const allToolCalls: ToolCall[] = [];

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
      const { messages: eventMessages, allEvents: newEvents, toolCalls: newToolCalls } = processEvents(
        span.events,
        span.start_time || startTime
      );
      messages.push(...eventMessages);
      allEvents.push(...newEvents);
      allToolCalls.push(...newToolCalls);
    }
  }

  // Sort trace by time
  trace.sort((a: any, b: any) => {
    if (a.start_time === b.start_time) {
      return a.end_time < b.end_time ? 1 : -1;
    }
    return a.start_time < b.start_time ? -1 : 1;
  });

  const toolNameCounts = new Map<string, number>();
  const firstToolCallByName = new Map<string, ToolCall>();

  for (const call of allToolCalls) {
    toolNameCounts.set(
      call.name,
      (toolNameCounts.get(call.name) || 0) + 1
    );
    if (!firstToolCallByName.has(call.name)) {
      firstToolCallByName.set(call.name, { ...call });
    }
  }

  const finalToolCalls = Array.from(firstToolCallByName.entries()).map(
    ([name, call]) => ({
      ...call,
      count: toolNameCounts.get(name),
    })
  );

  finalToolCalls.sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));

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
    tool_calls: finalToolCalls,
  };
}
