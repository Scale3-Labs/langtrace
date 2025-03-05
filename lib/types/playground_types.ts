export interface Conversation {
  id: string;
  role: OpenAIRole | CohereAIRole;
  content: string;
  name?: string;
}

export enum OpenAIModel {
  "o1" = "o1",
  "o1-2024-12-17" = "o1-2024-12-17",
  "o1-preview" = "o1-preview",
  "o1-preview-2024-09-12" = "o1-preview-2024-09-12",
  "o1-mini" = "o1-mini",
  "o1-mini-2024-09-12" = "o1-mini-2024-09-12",
  "gpt-4o-mini" = "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18" = "gpt-4o-mini-2024-07-18",
  "gpt-4o" = "gpt-4o",
  "gpt-4o-2024-05-13" = "gpt-4o-2024-05-13",
  "gpt-4o-2024-08-06" = "gpt-4o-2024-08-06",
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
    value: "o1-preview",
    label: "O1 Preview",
  },
  {
    value: "o1-mini",
    label: "O1 Mini",
  },
  {
    value: "gpt-4o-mini",
    label: "GPT-4 Omni Mini",
  },
  {
    value: "gpt-4o-mini-2024-07-18",
    label: "GPT-4 Omni Mini (2024-07-18)",
  },
  {
    value: "gpt-4o",
    label: "GPT-4 Omni",
  },
  {
    value: "gpt-4o-2024-05-13",
    label: "GPT-4 Omni (2024-05-13)",
  },
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
];

export const groqModels = [
  {
    value: "llama3-70b-8192",
    label: "Llama 3 70B 8192",
  },
  {
    value: "llama3-8b-8192",
    label: "Llama 3 8B 8192",
  },
  {
    value: "llama3-groq-70b-8192-tool-use-preview",
    label: "Llama 3 Groq 70B",
  },
  {
    value: "llama3-groq-8b-8192-tool-use-preview",
    label: "Llama 3 Groq 8B",
  },
  {
    value: "mixtral-8x7b-32768",
    label: "Mixtral 8x7B 32768",
  },
];

export const perplexityModels = [
  {
    value: "llama-3.1-8b-instruct",
    label: "Llama 3 8B Instruct",
  },
  {
    value: "llama-3.1-70b-instruct",
    label: "Llama 3 70B Instruct",
  },
  {
    value: "llama-3.1-sonar-small-128k-online",
    label: "Llama 3.1 Sonar Small 128K (Online)",
  },
  {
    value: "llama-3.1-sonar-small-128k-chat",
    label: "Llama 3.1 Sonar Small 128K (Chat)",
  },
  {
    value: "llama-3.1-sonar-large-128k-online",
    label: "Llama 3.1 Sonar Large 128K (Online)",
  },
  {
    value: "llama-3.1-sonar-large-128k-chat",
    label: "Llama 3.1 Sonar Large 128K (Chat)",
  },
  {
    value: "llama-3.1-sonar-huge-128k-online",
    label: "Llama 3.1 Sonar Huge 128K (Online)",
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
  model: string;
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

export interface GroqSettings {
  messages: Conversation[];
  model: string;
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

export interface PerplexitySettings {
  messages: Conversation[];
  model: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ChatInterface {
  id: string;
  vendor: string;
  settings:
    | OpenAISettings
    | AnthropicSettings
    | CohereSettings
    | GroqSettings
    | PerplexitySettings;
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

export interface GroqChatInterface extends ChatInterface {
  settings: GroqSettings;
}

export interface PerplexityChatInterface extends ChatInterface {
  settings: PerplexitySettings;
}
