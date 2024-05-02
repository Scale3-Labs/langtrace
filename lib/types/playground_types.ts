export interface Conversation {
  id: string;
  role: OpenAIRole;
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

export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    parameters: any;
    description?: string;
  };
}

export enum OpenAIRole {
  "user" = "user",
  "assistant" = "assistant",
  "system" = "system",
}

export interface OpenAI {
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
  tools?: OpenAITool[];
  toolChoice?: string | object;
  user?: string;
}

export interface LLMVendor {
  id: string;
  vendor: string;
  messages: Conversation[];
}
