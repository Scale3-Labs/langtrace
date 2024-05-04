export interface Conversation {
  id: string;
  role: OpenAIRole | CohereAIRole;
  content: string;
  name?: string;
}

export enum OpenAIModel {
  "gpt-4-turbo-preview" = "gpt-4-turbo-preview",
  "gpt-4-turbo-2024-04-09" = "gpt-4-turbo-2024-04-09",
  "gpt-4-turbo" = "gpt-4-turbo",
  "gpt-4-1106-preview" = "gpt-4-1106-preview",
  "gpt-4-0613" = "gpt-4-0613",
  "gpt-4-0125-preview" = "gpt-4-0125-preview",
  "gpt-4" = "gpt-4",
  "gpt-3.5-turbo-16k-0613" = "gpt-3.5-turbo-16k-0613",
  "gpt-3.5-turbo-16k" = "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-1106" = "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-0613" = "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-0301" = "gpt-3.5-turbo-0301",
  "gpt-3.5-turbo-0125" = "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo" = "gpt-3.5-turbo",
}

export enum AnthropicModel {
  "claude-3-opus-20240229" = "claude-3-opus-20240229",
  "claude-3-sonnet-20240229" = "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307" = "claude-3-haiku-20240307",
}

export const openAIModels = [
  {
    value: "gpt-4-turbo-preview",
    label: "GPT-4 Turbo (Preview)",
  },
  {
    value: "gpt-4-turbo-2024-04-09",
    label: "GPT-4 Turbo (2024-04-09)",
  },
  {
    value: "gpt-4-turbo",
    label: "GPT-4 Turbo",
  },
  {
    value: "gpt-4-1106-preview",
    label: "GPT-4 (1106 Preview)",
  },
  {
    value: "gpt-4-0613",
    label: "GPT-4 (0613)",
  },
  {
    value: "gpt-4-0125-preview",
    label: "GPT-4 (0125 Preview)",
  },
  {
    value: "gpt-4",
    label: "GPT-4",
  },
  {
    value: "gpt-3.5-turbo-16k-0613",
    label: "GPT-3.5 Turbo 16K (0613)",
  },
  {
    value: "gpt-3.5-turbo-16k",
    label: "GPT-3.5 Turbo 16K",
  },
  {
    value: "gpt-3.5-turbo-1106",
    label: "GPT-3.5 Turbo (1106)",
  },
  {
    value: "gpt-3.5-turbo-0613",
    label: "GPT-3.5 Turbo (0613)",
  },
  {
    value: "gpt-3.5-turbo-0301",
    label: "GPT-3.5 Turbo (0301)",
  },
  {
    value: "gpt-3.5-turbo-0125",
    label: "GPT-3.5 Turbo (0125)",
  },
  {
    value: "gpt-3.5-turbo",
    label: "GPT-3.5 Turbo",
  },
];

export const anthropicModels = [
  {
    value: "claude-3-opus-20240229",
    label: "Claude 3 (Opus, 2024-02-29)",
  },
  {
    value: "claude-3-sonnet-20240229",
    label: "Claude 3 (Sonnet, 2024-02-29)",
  },
  {
    value: "claude-3-haiku-20240307",
    label: "Claude 3 (Haiku, 2024-03-07)",
  },
];

export const cohereModels = [
  {
    value: "command-r-plus",
    label: "Command R Plus",
  },
  {
    value: "command-r",
    label: "Command R",
  },
  {
    value: "command",
    label: "Command",
  },
  {
    value: "command-nightly",
    label: "Command Nightly",
  },
  {
    value: "command-light",
    label: "Command Light",
  },
  {
    value: "command-light-nightly",
    label: "Command Light Nightly",
  },
];

export enum OpenAIRole {
  "user" = "user",
  "assistant" = "assistant",
  "system" = "system",
}

export enum CohereAIRole {
  "user" = "USER",
  "chatbot" = "CHATBOT",
}

export interface OpenAISettings {
  messages: Conversation[];
  model: OpenAIModel;
  frequencyPenalty?: number | null;
  logitBias?: any;
  logProbs?: boolean | null;
  topLogProbs?: number | null;
  maxTokens?: number | null;
  n?: number | null;
  presencePenalty?: number | null;
  responseFormat?: any;
  seed?: number | null;
  stop?: string | string[] | null;
  stream?: boolean | null;
  temperature?: number | null;
  topP?: number | null;
  tools?: string;
  toolChoice?: string;
  user?: string;
}

export interface AnthropicSettings {
  model: AnthropicModel;
  messages: Conversation[];
  maxTokens: number;
  metadata?: any;
  stream?: boolean;
  system?: string;
  temperature?: number;
  tools?: any;
  topK?: number;
  topP?: number;
}

export interface CohereSettings {
  messages: Conversation[];
  model?: string;
  stream?: boolean;
  preamble?: string;
  conversationId?: string;
  promptTruncation?: string;
  connectors?: any;
  searchQueriesOnly?: boolean;
  documents?: any;
  citationQuality?: string;
  temperature?: number;
  maxTokens?: number;
  maxInputTokens?: number;
  k?: number;
  p?: number;
  seed?: number;
  stopSequences?: any;
  frequencyPenalty?: number;
  presencePenalty?: number;
  tools?: any;
  toolResults?: any;
}

export interface ChatInterface {
  id: string;
  vendor: string;
  settings: OpenAISettings | AnthropicSettings | CohereSettings;
}

export interface OpenAIChatInterface extends ChatInterface {
  settings: OpenAISettings;
}

export interface AnthropicChatInterface extends ChatInterface {
  settings: AnthropicSettings;
}

export interface CohereChatInterface extends ChatInterface {
  settings: CohereSettings;
}
