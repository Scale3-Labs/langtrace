export interface LLMSpan {
  span_id: string;
  trace_id: string;
  start_time: string;
  prompt_id: string;
  input: any;
  output: any;
  model: string;
  raw_span: any;
}

export function processLLMSpan(span: any) {
  const attributes = span.attributes ? JSON.parse(span.attributes) : {};
  if (!attributes) return null;

  // extract the prompts and responses
  let input = [];
  let output = [];
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
      input.push(promptEvent["attributes"]["gen_ai.prompt"]);
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
      output.push(responseEvent["attributes"]["gen_ai.completion"]);
    }
  }

  // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
  if ("llm.prompts" in attributes && "llm.responses" in attributes) {
    input = attributes["llm.prompts"];
    output = attributes["llm.responses"];
  }

  // extract the model
  let model = "";
  model =
    attributes["gen_ai.response.model"] ||
    attributes["gen_ai.request.model"] ||
    attributes["llm.model"] ||
    "";

  // extract the user_id and prompt_id if available
  const prompt_id = attributes["prompt_id"] || "";

  // id and start time
  const span_id = span.span_id;
  const trace_id = span.trace_id;
  const start_time = span.start_time;
  const raw_span = span;

  const result: LLMSpan = {
    trace_id,
    span_id,
    start_time,
    input,
    output,
    model,
    prompt_id,
    raw_span,
  };

  return result;
}
