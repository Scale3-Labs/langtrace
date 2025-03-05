import {
  DatabaseSpanAttributes,
  FrameworkSpanAttributes,
  LLMSpanAttributes,
} from "@langtrase/trace-attributes";
import { Test } from "@prisma/client";
import { TiktokenEncoding } from "js-tiktoken";
export const EVALUATIONS_DOCS_URL =
  "https://docs.langtrace.ai/features/evaluations";
export const HOW_TO_USER_ID =
  "https://docs.langtrace.ai/features/attach_user_id";
export const HOW_TO_PROMPT_FETCHING =
  "https://docs.langtrace.ai/features/attach_prompt_id";
export const HOW_TO_GROUP_RELATED_OPERATIONS =
  "https://docs.langtrace.ai/features/grouptraces";
export const HOW_TO_DO_ANNOTATIONS =
  "https://docs.langtrace.ai/features/annotations#annotations";
export const SCHEDULE_CALL_LINK =
  "https://calendar.app.google/Go5gXNPcqZjAY4i47";
export const OTEL_GENAI = "https://opentelemetry.io/docs/specs/semconv/gen-ai/";
export const OTEL_GENAI_EVENTS =
  "https://opentelemetry.io/docs/specs/semconv/gen-ai/llm-spans/#events";
export const OTEL_GENAI_ATTRIBUTES =
  "https://opentelemetry.io/docs/specs/semconv/gen-ai/llm-spans/#llm-request-attributes";
export const USER_FEEDBACK_LINK =
  "https://docs.langtrace.ai/tracing/trace_user_feedback#example-user-score";

// TODO: Add more models
// https://github.com/dqbd/tiktoken/blob/74c147e19584a3a1acea0c8e0da4d39415cd33e0/wasm/src/lib.rs#L328
export const TIKTOKEN_MODEL_MAPPING: Record<string, TiktokenEncoding> = {
  "gpt-35-turbo": "cl100k_base",
  "gpt-35-turbo-16k": "cl100k_base",
  "gpt-35-turbo-instruct": "cl100k_base",
  "gpt-4": "cl100k_base",
  "gpt-4o": "o200k_base",
  "gpt-4o-2024-05-13": "o200k_base",
  "gpt-4o-mini": "o200k_base",
  "gpt-4o-mini-2024-07-18": "o200k_base",
  "o3-mini": "o200k_base",
  "o1-preview": "o200k_base",
  "o1-mini": "o200k_base",
  "o1-preview-2024-09-12": "o200k_base",
  "o1-mini-2024-09-12": "o200k_base",
};

export type LangTraceAttributes = LLMSpanAttributes &
  DatabaseSpanAttributes &
  FrameworkSpanAttributes;

export type SpanStatusCode = "UNSET" | "OK" | "ERROR";

export const CLICK_HOUSE_CONSTANTS = {
  database: process.env.CLICK_HOUSE_DATABASE_NAME,
};

export interface CostTableEntry {
  input: number;
  output: number;
  cached_input?: number;
}

// cost per 1000 tokens
export const OPENAI_PRICING: Record<string, CostTableEntry> = {
  "o1-preview": {
    input: 0.015,
    cached_input: 0.0075,
    output: 0.06,
  },
  "o1-mini": {
    input: 0.0011,
    cached_input: 0.00055,
    output: 0.0044,
  },
  o1: {
    input: 0.015,
    cached_input: 0.0075,
    output: 0.06,
  },
  "o3-mini": {
    input: 0.0011,
    cached_input: 0.00055,
    output: 0.0044,
  },
  "gpt-4.5": {
    input: 0.075,
    cached_input: 0.0375,
    output: 0.15,
  },
  "gpt-4o-mini": {
    input: 0.00015,
    cached_input: 0.000075,
    output: 0.0006,
  },
  "gpt-4o-mini-2024-07-18": {
    input: 0.00015,
    cached_input: 0.000075,
    output: 0.0006,
  },
  "gpt-4o": {
    input: 0.0025,
    cached_input: 0.000125,
    output: 0.01,
  },
  "gpt-4o-2024-05-13": {
    input: 0.0025,
    cached_input: 0.000125,
    output: 0.01,
  },
  "gpt-4o-2024-08-06": {
    input: 0.0025,
    cached_input: 0.000125,
    output: 0.01,
  },
  "gpt-4-turbo": {
    input: 0.01,
    output: 0.03,
  },
  "gpt-4-turbo-2024-04-09": {
    input: 0.01,
    output: 0.03,
  },
  "gpt-4": {
    input: 0.03,
    output: 0.06,
  },
  "gpt-4-32k": {
    input: 0.06,
    output: 0.12,
  },
  "gpt-4-0125-preview": {
    input: 0.01,
    output: 0.03,
  },
  "gpt-4-1106-preview": {
    input: 0.01,
    output: 0.03,
  },
  "gpt-4-1106-vision-preview": {
    input: 0.01,
    output: 0.03,
  },
  "gpt-3.5-turbo": {
    // Temporary workaround. Gotta figure out if it's 0125 or instruct through the SDK.
    input: 0.0005,
    output: 0.0015,
  },
  "gpt-3.5-turbo-0125": {
    input: 0.0005,
    output: 0.0015,
  },
  "gpt-3.5-turbo-0613": {
    input: 0.0005,
    output: 0.0015,
  },
  "gpt-3.5-turbo-instruct": {
    input: 0.0015,
    output: 0.002,
  },
  // embedding models
  "text-embedding-ada-002": {
    input: 0.0001,
    output: 0,
  },
  "text-embedding-3-small": {
    input: 0.00002,
    output: 0,
  },
  "text-embedding-3-large": {
    input: 0.00013,
    output: 0,
  },
};

export const MISTRAL_PRICING: Record<string, CostTableEntry> = {
  "mistral-large-latest": {
    input: 0.002,
    output: 0.006,
  },
  "pixtral-large-latest": {
    input: 0.002,
    output: 0.006,
  },
  "mistral-small-latest": {
    input: 0.0002,
    output: 0.0006,
  },
  "codestral-latest": {
    input: 0.0002,
    output: 0.0006,
  },
  "ministral-8b-latest": {
    input: 0.0001,
    output: 0.0001,
  },
  "ministral-3b-latest": {
    input: 0.00004,
    output: 0.00004,
  },
  "mistral-embed": {
    input: 0.0001,
    output: 0,
  },
  "open-mistral-7b": {
    input: 0.00025,
    output: 0.00025,
  },
  "open-mixtral-8x7b": {
    input: 0.0007,
    output: 0.0007,
  },
  "open-mixtral-8x22b": {
    input: 0.002,
    output: 0.006,
  },
};

export const XAI_PRICING: Record<string, CostTableEntry> = {
  "grok-beta": {
    input: 0.005,
    output: 0.015,
  },
};

export const ANTHROPIC_PRICING: Record<string, CostTableEntry> = {
  "claude-3-5-sonnet": {
    input: 0.003,
    output: 0.015,
  },
  "claude-3-5-haiku": {
    input: 0.001,
    output: 0.005,
  },
  "claude-3-haiku": {
    input: 0.00025,
    output: 0.00125,
  },
  "claude-3-sonnet": {
    input: 0.003,
    output: 0.015,
  },
  "claude-3-opus": {
    input: 0.015,
    output: 0.075,
  },
};

export const DEEPSEEK_PRICING: Record<string, CostTableEntry> = {
  "deepseek-coder": {
    input: 0.00014,
    output: 0.00028,
  },
};

// https://docs.perplexity.ai/docs/pricing --> slightly unclear
// https://docs.perplexity.ai/changelog/api-updates-february-2024 --> diff prices
export const PERPLEXITY_PRICING: Record<string, CostTableEntry> = {
  "llama-3.1-sonar-huge-128k-online": {
    input: 0.005,
    output: 0.005,
  },
  "llama-3.1-8b-instruct": {
    input: 0.0002,
    output: 0.0002,
  },
  "llama-3.1-70b-instruct": {
    input: 0.001,
    output: 0.001,
  },
  "llama-3.1-sonar-small-128k-online": {
    input: 0.0002,
    output: 0.0002,
  },
  "llama-3.1-sonar-small-128k-chat": {
    input: 0.0002,
    output: 0.0002,
  },
  "llama-3.1-sonar-large-128k-online": {
    input: 0.001,
    output: 0.001,
  },
  "llama-3.1-sonar-large-128k-chat": {
    input: 0.001,
    output: 0.001,
  },
};

export const COHERE_PRICING: Record<string, CostTableEntry> = {
  "command-light": {
    input: 0.0003,
    output: 0.0006,
  },
  "command-light-nightly": {
    input: 0.0003,
    output: 0.0006,
  },
  // prettier-ignore
  "command": {
    input: 0.001,
    output: 0.002,
  },
  "command-nightly": {
    input: 0.001,
    output: 0.002,
  },
  "command-r": {
    input: 0.0005,
    output: 0.0015,
  },
  "command-r-08-2024": {
    input: 0.0005,
    output: 0.0015,
  },
  "command-r-03-2024": {
    input: 0.0005,
    output: 0.0015,
  },
  "command-r-plus": {
    input: 0.003,
    output: 0.015,
  },
  "command-r-plus-08-2024": {
    input: 0.003,
    output: 0.015,
  },
  "command-r-plus-04-2024": {
    input: 0.003,
    output: 0.015,
  },
};

export const GROQ_PRICING: Record<string, CostTableEntry> = {
  "llama3-70b-8192": {
    input: 0.00059,
    output: 0.00079,
  },
  "llama3-8b-8192": {
    input: 0.00005,
    output: 0.00008,
  },
  "llama3-groq-70b-8192-tool-use-preview": {
    input: 0.00089,
    output: 0.00089,
  },
  "llama3-groq-8b-8192-tool-use-preview": {
    input: 0.00019,
    output: 0.00019,
  },
  "mixtral-8x7b-32768": {
    input: 0.00024,
    output: 0.00024,
  },
};

export const AZURE_PRICING: Record<string, CostTableEntry> = {
  "gpt-4o": {
    input: 0.005,
    output: 0.015,
  },
  "gpt-4o-mini": {
    input: 0.00015,
    output: 0.0006,
  },
  "gpt-4": {
    input: 0.03,
    output: 0.06,
  },
  "o1-preview": {
    input: 0.015,
    output: 0.06,
  },
  "o1-mini": {
    input: 0.015,
    output: 0.06,
  },
};

export const GEMINI_PRICING: Record<string, CostTableEntry> = {
  "gemini-1.5-pro": {
    input: 0.00125, // $1.25 per 1M tokens = $0.00125 per 1K tokens
    output: 0.005, // $5.00 per 1M tokens = $0.005 per 1K tokens
  },
  "gemini-1.5-flash": {
    input: 0.000075, // $0.075 per 1M tokens = $0.000075 per 1K tokens
    output: 0.0003, // $0.30 per 1M tokens = $0.0003 per 1K tokens
  },
  "gemini-1.5-flash-8b": {
    input: 0.0000375, // $0.0375 per 1M tokens = $0.0000375 per 1K tokens
    output: 0.00015, // $0.15 per 1M tokens = $0.00015 per 1K tokens
  },
  "gemini-1.0-pro": {
    input: 0.0005, // $0.50 per 1M tokens = $0.0005 per 1K tokens
    output: 0.0015, // $1.50 per 1M tokens = $0.0015 per 1K tokens
  },
};

export const PAGE_SIZE = 15;

export const DEFAULT_TESTS: Partial<Test>[] = [
  {
    name: "Factual Accuracy",
    description:
      "Evaluate the model's ability to provide factually correct answers, often involving comparison with verified data sources or databases.",
  },
  {
    name: "Quality",
    description:
      "Better for tasks like summarization where coverage and quality of the content is important.",
  },
];

export const LLM_VENDOR_APIS = [
  {
    value: "OPENAI_API_KEY",
    label: "OpenAI",
  },
  {
    value: "ANTHROPIC_API_KEY",
    label: "Anthropic",
  },
  {
    value: "COHERE_API_KEY",
    label: "Cohere",
  },
  {
    value: "GROQ_API_KEY",
    label: "Groq",
  },
  {
    value: "PERPLEXITY_API_KEY",
    label: "Perplexity",
  },
];

export const LLM_VENDORS = [
  {
    value: "openai",
    label: "OpenAI",
  },
  {
    value: "anthropic",
    label: "Anthropic",
  },
  {
    value: "cohere",
    label: "Cohere",
  },
  {
    value: "groq",
    label: "Groq",
  },
  {
    value: "perplexity",
    label: "Perplexity",
  },
];

export const SUPPORTED_VENDORS: Record<string, string> = {
  ANTHROPIC: "Anthropic",
  ARCH: "Arch",
  AZURE: "Azure",
  CHROMA: "Chroma",
  CREWAI: "CrewAI",
  DEEPSEEK: "DeepSeek",
  DSPY: "DSPy",
  GROQ: "Groq",
  LANGCHAIN: "Langchain",
  LANGCHAIN_COMMUNITY: "Langchain Community",
  LANGCHAIN_CORE: "Langchain Core",
  LANGGRAPH: "Langgraph",
  LLAMAINDEX: "LlamaIndex",
  MILVUS: "Milvus",
  OPENAI: "OpenAI",
  PINECONE: "Pinecone",
  COHERE: "Cohere",
  PPLX: "Perplexity",
  QDRANT: "Qdrant",
  WEAVIATE: "Weaviate",
  OLLAMA: "Ollama",
  VERTEXAI: "VertexAI",
  GEMINI: "Gemini",
  EMBEDCHAIN: "Embedchain",
  VERCEL: "Vercel",
};

export const jsontheme = {
  scheme: "monokai",
  author: "wimer hazenberg (http://www.monokai.nl)",
  base00: "#272822",
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633",
};

export const RECIPE_DOCS = {
  crewai:
    "https://github.com/Scale3-Labs/langtrace-recipes/blob/main/integrations/llm-framework/crewai/starter.ipynb",
};
