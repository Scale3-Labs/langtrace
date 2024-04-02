import {
  DatabaseSpanAttributes,
  FrameworkSpanAttributes,
  LLMSpanAttributes,
} from "@langtrase/trace-attributes";
import { TiktokenEncoding } from "js-tiktoken";

export const SCHEDULE_CALL_LINK =
  "https://calendar.app.google/Go5gXNPcqZjAY4i47";

export const CLOUD_PROVIDERS: Record<string, any> = {
  AZURE: {
    name: "Azure",
    disabled: false,
  },
  GCP: {
    name: "GCP",
    disabled: true,
  },
  AWS: {
    name: "AWS",
    disabled: true,
  },
};

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

// cost per 1000 tokens
export const OPENAI_PRICING: Record<string, any> = {
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

export const ANTHROPIC_PRICING: Record<string, any> = {
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
