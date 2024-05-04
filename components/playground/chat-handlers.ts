import {
  AnthropicChatInterface,
  OpenAIChatInterface,
} from "@/lib/types/playground_types";

export async function openAIHandler(
  llm: OpenAIChatInterface,
  apiKey: string
): Promise<any> {
  const body: any = {};
  if (llm.settings.messages.length > 0) {
    body.messages = llm.settings.messages.map((m) => {
      return { content: m.content, role: m.role };
    });
  }
  if (llm.settings.model) {
    body.model = llm.settings.model;
  }
  if (llm.settings.temperature) {
    body.temperature = llm.settings.temperature;
  }
  if (llm.settings.maxTokens) {
    body.max_tokens = llm.settings.maxTokens;
  }
  if (llm.settings.n) {
    body.n = llm.settings.n;
  }
  if (llm.settings.stop) {
    body.stop = llm.settings.stop;
  }
  if (llm.settings.frequencyPenalty) {
    body.frequency_penalty = llm.settings.frequencyPenalty;
  }
  if (llm.settings.presencePenalty) {
    body.presence_penalty = llm.settings.presencePenalty;
  }
  if (llm.settings.logProbs) {
    body.logprobs = llm.settings.logProbs;
  }
  if (llm.settings.topLogProbs) {
    body.top_logprobs = llm.settings.topLogProbs;
  }
  if (llm.settings.logitBias !== undefined) {
    body.logit_bias = llm.settings.logitBias;
  }
  if (llm.settings.responseFormat) {
    body.response_format = llm.settings.responseFormat;
  }
  if (llm.settings.seed) {
    body.seed = llm.settings.seed;
  }
  if (llm.settings.stream !== undefined) {
    body.stream = llm.settings.stream;
  }
  if (llm.settings.topP) {
    body.top_p = llm.settings.topP;
  }
  if (llm.settings.tools && llm.settings.tools.length > 0) {
    body.tools = llm.settings.tools;
  }
  if (llm.settings.toolChoice) {
    body.tool_choice = llm.settings.toolChoice;
  }
  if (llm.settings.user) {
    body.user = llm.settings.user;
  }

  // Get the API key from the browser store
  body.apiKey = apiKey;

  const response = await fetch("/api/chat/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
}

export async function anthropicHandler(
  llm: AnthropicChatInterface,
  apiKey: string
): Promise<any> {
  const body: any = {};
  if (llm.settings.messages.length > 0) {
    body.messages = llm.settings.messages.map((m) => {
      return { content: m.content, role: m.role };
    });
  }
  if (llm.settings.model) {
    body.model = llm.settings.model;
  }
  if (llm.settings.temperature) {
    body.temperature = llm.settings.temperature;
  }
  if (llm.settings.maxTokens) {
    body.max_tokens = llm.settings.maxTokens;
  }
  if (llm.settings.stream !== undefined) {
    body.stream = llm.settings.stream;
  }
  if (llm.settings.topP) {
    body.top_p = llm.settings.topP;
  }
  if (llm.settings.tools && llm.settings.tools.length > 0) {
    body.tools = llm.settings.tools;
  }
  if (llm.settings.topK) {
    body.top_k = llm.settings.topK;
  }
  if (llm.settings.metadata) {
    body.metadata = llm.settings.metadata;
  }
  if (llm.settings.system) {
    body.system = llm.settings.system;
  }

  // Get the API key from the browser store
  body.apiKey = apiKey;

  const response = await fetch("/api/chat/anthropic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
}
