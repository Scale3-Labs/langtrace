import {
  AnthropicChatInterface,
  CohereChatInterface,
  GroqChatInterface,
  OpenAIChatInterface,
  PerplexityChatInterface,
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

export async function cohereHandler(
  llm: CohereChatInterface,
  apiKey: string
): Promise<any> {
  const body: any = {};
  if (llm.settings.messages.length > 0) {
    body.message =
      llm.settings.messages[llm.settings.messages.length - 1].content;
    body.chat_history = llm.settings.messages.map((m, i) => {
      if (i === llm.settings.messages.length - 1) return null;
      return { message: m.content, role: m.role };
    });
  }
  // remove null values
  body.chat_history = body.chat_history.filter(Boolean);

  if (llm.settings.model) {
    body.model = llm.settings.model;
  }
  if (llm.settings.temperature) {
    body.temperature = llm.settings.temperature;
  }
  if (llm.settings.maxTokens) {
    body.max_tokens = llm.settings.maxTokens;
  }
  if (llm.settings.maxInputTokens) {
    body.max_input_tokens = llm.settings.maxInputTokens;
  }
  if (llm.settings.stream !== undefined) {
    body.stream = llm.settings.stream;
  }
  if (llm.settings.preamble) {
    body.preamble = llm.settings.preamble;
  }
  if (llm.settings.conversationId) {
    body.conversation_id = llm.settings.conversationId;
  }
  if (llm.settings.promptTruncation) {
    body.prompt_truncation = llm.settings.promptTruncation;
  }
  if (llm.settings.connectors) {
    body.connectors = llm.settings.connectors;
  }
  if (llm.settings.searchQueriesOnly) {
    body.search_queries_only = llm.settings.searchQueriesOnly;
  }
  if (llm.settings.documents) {
    body.documents = llm.settings.documents;
  }
  if (llm.settings.citationQuality) {
    body.citation_quality = llm.settings.citationQuality;
  }
  if (llm.settings.k) {
    body.k = llm.settings.k;
  }
  if (llm.settings.p) {
    body.p = llm.settings.p;
  }
  if (llm.settings.seed) {
    body.seed = llm.settings.seed;
  }
  if (llm.settings.stopSequences) {
    body.stop_sequences = llm.settings.stopSequences;
  }
  if (llm.settings.frequencyPenalty) {
    body.frequency_penalty = llm.settings.frequencyPenalty;
  }
  if (llm.settings.presencePenalty) {
    body.presence_penalty = llm.settings.presencePenalty;
  }
  if (llm.settings.tools && llm.settings.tools.length > 0) {
    body.tools = llm.settings.tools;
  }
  if (llm.settings.toolResults) {
    body.tool_results = llm.settings.toolResults;
  }

  // Get the API key from the browser store
  body.apiKey = apiKey;

  const response = await fetch("/api/chat/cohere", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
}

export async function groqHandler(
  llm: GroqChatInterface,
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

  const response = await fetch("/api/chat/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
}

export async function perplexityHandler(
  llm: PerplexityChatInterface,
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
  if (llm.settings.max_tokens) {
    body.max_tokens = llm.settings.max_tokens;
  }
  if (llm.settings.frequency_penalty) {
    body.frequency_penalty = llm.settings.frequency_penalty;
  }
  if (llm.settings.presence_penalty) {
    body.presence_penalty = llm.settings.presence_penalty;
  }
  if (llm.settings.stream !== undefined) {
    body.stream = llm.settings.stream;
  }
  if (llm.settings.top_p) {
    body.top_p = llm.settings.top_p;
  }

  // Get the API key from the browser store
  body.apiKey = apiKey;

  const response = await fetch("/api/chat/perplexity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return response;
}
