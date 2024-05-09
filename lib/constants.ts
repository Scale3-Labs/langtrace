import {
  DatabaseSpanAttributes,
  FrameworkSpanAttributes,
  LLMSpanAttributes,
} from "@langtrase/trace-attributes";
import { Test } from "@prisma/client";
import { TiktokenEncoding } from "js-tiktoken";

export const SCHEDULE_CALL_LINK =
  "https://calendar.app.google/Go5gXNPcqZjAY4i47";

// TODO: Add more models
// https://github.com/dqbd/tiktoken/blob/74c147e19584a3a1acea0c8e0da4d39415cd33e0/wasm/src/lib.rs#L328
export const TIKTOKEN_MODEL_MAPPING: Record<string, TiktokenEncoding> = {
  "gpt-35-turbo": "cl100k_base",
  "gpt-35-turbo-16k": "cl100k_base",
  "gpt-35-turbo-instruct": "cl100k_base",
  "gpt-4": "cl100k_base",
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
}

// cost per 1000 tokens
export const OPENAI_PRICING: Record<string, CostTableEntry> = {
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
  "gpt-3.5-turbo-instruct": {
    input: 0.0015,
    output: 0.002,
  },
};

export const ANTHROPIC_PRICING: Record<string, CostTableEntry> = {
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
  "claude-2.1": {
    input: 0.008,
    output: 0.024,
  },
  "claude-2.0": {
    input: 0.008,
    output: 0.024,
  },
  "claude-instant": {
    input: 0.0008,
    output: 0.0024,
  },
};

// https://docs.perplexity.ai/docs/pricing --> slightly unclear
// https://docs.perplexity.ai/changelog/api-updates-february-2024 --> diff prices
export const PERPLEXITY_PRICING: Record<string, CostTableEntry> = {
  "sonar-small-chat": {
    input: 0.0002,
    output: 0.0002,
  },
  "sonar-small-online": {
    // + $5/K requests
    input: 0.0002,
    output: 0.0002,
  },
  "sonar-medium-chat": {
    input: 0.0006,
    output: 0.0006,
  },
  "sonar-medium-online": {
    // + $5/K requests
    input: 0.0006,
    output: 0.0006,
  },
  "mistral-7b-instruct": {
    input: 0.0002,
    output: 0.0002,
  },
  "mixtral-8x7b-instruct": {
    input: 0.0006,
    output: 0.0018,
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
  "command-r-plus": {
    input: 0.003,
    output: 0.015,
  },
};

export const PAGE_SIZE = 15;

export const DEFAULT_TESTS: Partial<Test>[] = [
  {
    name: "Factual Accuracy",
    description:
      "Evaluates the model's ability to provide factually correct answers, often involving comparison with verified data sources or databases.",
  },
  {
    name: "Adversarial Testing",
    description:
      "Present the model with intentionally tricky or misleading inputs to test its robustness and ability to handle edge cases without producing nonsensical or incorrect outputs.",
  },
  {
    name: "Consistency Checks",
    description:
      "Ensuring that the model provides consistent answers to the same question, even if phrased differently or asked at different times.",
  },
  {
    name: "Quality",
    description:
      "Better for tasks like summarization where coverage and quality of the content is important.",
  },
  {
    name: "Bias Detection",
    description:
      "Evaluating the responses for evidence of bias, including gender, racial, cultural, or ideological biases, to ensure the model's fairness and inclusivity.",
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
