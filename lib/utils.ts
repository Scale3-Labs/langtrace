import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import { createHash, randomBytes } from "crypto";
import { format } from "date-fns";
import { TiktokenEncoding, getEncoding } from "js-tiktoken";
import { NextResponse } from "next/server";
import { prettyPrintJson } from "pretty-print-json";
import qs from "qs";
import { twMerge } from "tailwind-merge";
import { Span } from "./clients/scale3_clickhouse/models/span";
import {
  ANTHROPIC_PRICING,
  COHERE_PRICING,
  CostTableEntry,
  LangTraceAttributes,
  OPENAI_PRICING,
  PERPLEXITY_PRICING,
  SpanStatusCode,
} from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractPropertyNames(...schemas: string[][]): string[] {
  const propertyNames = new Set<string>();

  schemas.forEach((schema) => {
    schema.forEach((propertyName) => {
      propertyNames.add(propertyName);
    });
  });

  return Array.from(propertyNames);
}

export function formatDate(isoDateString: string) {
  const dateObject = new Date(isoDateString);

  // Explicitly define the type of the options object
  const options = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  } as Intl.DateTimeFormatOptions;
  let formattedDate = dateObject.toLocaleDateString("en-US", options);

  // Extract the day from the formatted date
  const day = dateObject.getDate();

  // Determine the suffix
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) {
    suffix = "st";
  } else if (day % 10 === 2 && day !== 12) {
    suffix = "nd";
  } else if (day % 10 === 3 && day !== 13) {
    suffix = "rd";
  }

  // Construct the formatted date manually
  const month = dateObject.toLocaleString("en-US", { month: "long" });
  const year = dateObject.getFullYear();
  formattedDate = `${month} ${day}${suffix}, ${year}`;

  return formattedDate;
}

export function formatDateTime(
  isoString: string,
  useLocalTime: boolean = false
): string {
  // Create a Date object from the ISO string.
  const date = new Date(isoString);

  // Define an array of month names to use in the formatted string.
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Use UTC or local time methods based on the useLocalTime parameter.
  const monthMethod = useLocalTime ? "getMonth" : "getUTCMonth";
  const dateMethod = useLocalTime ? "getDate" : "getUTCDate";
  const yearMethod = useLocalTime ? "getFullYear" : "getUTCFullYear";
  const hoursMethod = useLocalTime ? "getHours" : "getUTCHours";
  const minutesMethod = useLocalTime ? "getMinutes" : "getUTCMinutes";
  const secondsMethod = useLocalTime ? "getSeconds" : "getUTCSeconds";

  // Construct the formatted string using the Date object and the selected methods.
  const formatted = `${monthNames[date[monthMethod]()]} ${date[
    dateMethod
  ]()}, ${date[yearMethod]()}, ${padZero(date[hoursMethod]())}:${padZero(
    date[minutesMethod]()
  )}:${padZero(date[secondsMethod]())}${useLocalTime ? "" : " UTC"}`;

  // Return the formatted string.
  return formatted;
}

function padZero(num: number): string {
  return num < 10 ? `0${num}` : num.toString();
}

export function generateApiKey(): string {
  return randomBytes(32).toString("hex"); // Generates 64 characters hex string
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function estimateTokensUsingTikToken(
  prompt: string,
  model: TiktokenEncoding
): number {
  const encoding = getEncoding(model);
  const tokens = encoding.encode(prompt);
  return tokens.length;
}

export function formatDateTimeLocal(isoString: string): string {
  // Create a Date object from the ISO string.
  const date = new Date(isoString);

  // Use Intl.DateTimeFormat to format the date in the local timezone.
  // You can customize 'en-US' to the user's locale if available.
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short", // abbreviated month name
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short", // short timezone name, e.g., EST, PDT
    hour12: false, // Use 24-hour clock; set to true for AM/PM format.
  });

  // Return the formatted string.
  return formatter.format(date);
}

export interface Normalized {
  name: string;
  trace_id: string;
  span_id: string;
  trace_state: string;
  kind: string;
  parent_id: string;
  start_time: string;
  duration: number;
  end_time: string;
  status_code: SpanStatusCode;
  attributes: LangTraceAttributes;
  events: [];
  links: [];
}

function convertDurationToMicroseconds(duration: [number, number]): number {
  const [seconds, nanoseconds] = duration;
  // Convert seconds to microseconds and add microseconds
  const totalMicroseconds = seconds * 1000000 + nanoseconds / 1000;
  return totalMicroseconds;
}

export function convertToDateTime64(dateTime: [number, number]): string {
  // Extract seconds and nanoseconds from the input
  const [seconds, nanoseconds] = dateTime;

  // Convert seconds to milliseconds and add nanoseconds converted to milliseconds
  const totalMilliseconds = seconds * 1000 + nanoseconds / 1_000_000;

  // Create a Date object from the total milliseconds
  const date = new Date(totalMilliseconds);

  // Format the date to a string. This part depends on your desired format.
  // For simplicity, we'll use ISO string format here and then add the nanoseconds part.
  const dateString = date.toISOString();

  // Extracting the microseconds part, since JavaScript's Date does not support nanoseconds.
  // Assuming we want to display up to microseconds precision for DateTime64.
  const microseconds = Math.floor(nanoseconds / 1000) % 1000;

  // Append the microseconds part to the dateString, replacing the 'Z' at the end.
  // This example results in a format with microseconds precision, assuming that's what's meant by DateTime64.
  const dateTime64String = `${dateString.slice(0, -1)}${String(
    microseconds
  ).padStart(3, "0")}Z`;

  return dateTime64String;
}

function determineStatusCode(inputData: any): SpanStatusCode {
  const code = inputData.status?.code;
  const statusCode = inputData.status?.status_code;
  if (statusCode) return statusCode;

  if (code === 0) return "UNSET";
  if (code === 1) return "OK";
  if (code === 2) return "ERROR";

  return "UNSET";
}

function getDurationInMicroseconds(startTime: string, endTime: string): number {
  // Parse the timestamps, assuming the format is "YYYY-MM-DDTHH:mm:ss.SSS.ZZZ"
  // Where "SSS" is milliseconds and "ZZZ" is microseconds (which we'll handle separately)
  const startParts = startTime.split(".");
  const endParts = endTime.split(".");

  // Extract milliseconds and microseconds parts
  const startMillisecondsPart = startParts[1].substring(0, 3);
  const startMicrosecondsPart = parseInt(startParts[1].substring(4, 7), 10);
  const endMillisecondsPart = endParts[1].substring(0, 3);
  const endMicrosecondsPart = parseInt(endParts[1].substring(4, 7), 10);

  // Create Date objects for the main parts
  const startDate = new Date(startParts[0] + "." + startMillisecondsPart + "Z");
  const endDate = new Date(endParts[0] + "." + endMillisecondsPart + "Z");

  // Calculate duration in microseconds
  const durationMilliseconds = endDate.getTime() - startDate.getTime();
  const durationMicroseconds =
    durationMilliseconds * 1000 + (endMicrosecondsPart - startMicrosecondsPart);

  return durationMicroseconds;
}

export function normalizeData(inputDataArray: any[]): Normalized[] {
  return inputDataArray.map((inputData) => {
    try {
      return {
        name: inputData.name,
        trace_id: inputData.context?.trace_id || inputData.traceId,
        span_id: inputData.id || inputData.context?.span_id || inputData.spanId,
        trace_state: inputData.traceState || inputData.context?.trace_state,
        kind: inputData.kind,
        parent_id:
          inputData.parentId || inputData.parent_id || inputData.parentSpanId,
        start_time: inputData.startTime
          ? convertToDateTime64(inputData.startTime)
          : inputData.start_time,
        end_time: inputData.endTime
          ? convertToDateTime64(inputData.endTime)
          : inputData.end_time,
        duration: inputData.duration
          ? convertDurationToMicroseconds(inputData.duration)
          : getDurationInMicroseconds(inputData.start_time, inputData.end_time),
        attributes: inputData.attributes,
        status_code: determineStatusCode(inputData),
        events: inputData.events,
        links: inputData.links,
      };
    } catch (error) {
      throw new Error(`An error occurred while normalizing data: ${error}`);
    }
  });
}

export function prepareForClickhouse(spans: Normalized[]): Span[] {
  return spans.map((span) => {
    try {
      return {
        name: span.name,
        trace_id: span.trace_id,
        span_id: span.span_id,
        trace_state: span.trace_state,
        kind: parseInt(span.kind),
        parent_id: span.parent_id,
        start_time: span.start_time,
        end_time: span.end_time,
        attributes: JSON.stringify(span.attributes),
        status_code: span.status_code,
        events: JSON.stringify(span.events),
        links: JSON.stringify(span.links),
        duration: span.duration,
      };
    } catch (error) {
      throw new Error(
        `An error occurred while preparing data for Clickhouse: ${error}`
      );
    }
  });
}

export function fillPromptStringTemplate(
  template: string,
  variables: { [key: string]: string }
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

//TODO: Move to a middleware
export function parseQueryString(url: string): Record<string, any> {
  return qs.parse(url.split("?")[1], {
    decoder(str) {
      if (str === "true") return true;
      if (str === "false") return false;
      try {
        return JSON.parse(str);
      } catch {
        return str;
      }
    },
    interpretNumericEntities: true, // Ensures numeric entities are parsed correctly
    parseArrays: true, // Ensures arrays are parsed correctly
    allowDots: true, // Allows dot notation for nested objects
  });
}

export async function authApiKey(
  api_key?: string,
  team_auth?: boolean
): Promise<NextResponse> {
  if (!api_key) {
    return NextResponse.json(
      {
        error: "api key is required",
      },
      { status: 400 }
    );
  }

  if (team_auth) {
    const team = await prisma.team.findFirst({
      where: {
        apiKeyHash: hashApiKey(api_key),
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid API key" },
        { status: 401 }
      );
    } else {
      return NextResponse.json({ data: { team: team } }, { status: 200 });
    }
  }
  const project = await prisma.project.findFirst({
    where: {
      apiKeyHash: hashApiKey(api_key),
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid API key" },
      { status: 401 }
    );
  } else {
    return NextResponse.json({ data: { project: project } }, { status: 200 });
  }
}

// Function to parse known nested JSON strings within an object
export function parseNestedJsonFields(obj: string) {
  const jsonObject = JSON.parse(obj);
  const fieldsToParse = [
    "llm.prompts",
    "llm.token.counts",
    "llm.responses",
    "langchain.inputs",
    "langchain.outputs",
    "crewai.crew.config",
    "crewai.agent.config",
    "crewai.task.config",
    "dspy.optimizer.module.prog",
    "dspy.optimizer.config",
    "dspy.signature.args",
    "embedder",
  ];
  fieldsToParse.forEach((field) => {
    if (jsonObject[field] && typeof jsonObject[field] === "string") {
      try {
        jsonObject[field] = JSON.parse(jsonObject[field]);
      } catch (e) {
        console.error(`Error parsing field ${field}: ${e}`);
      }
    }
  });

  // Stringify the fully parsed object for display, with indentation for readability
  const formattedJsonString = JSON.stringify(jsonObject, null, 2);
  return formattedJsonString;
}

export function calculatePriceFromUsage(
  vendor: string,
  model: string,
  usage: {
    input_tokens: number;
    output_tokens: number;
  }
): any {
  if (!model) return { total: 0, input: 0, output: 0 };
  let costTable: CostTableEntry | undefined = undefined;

  if (vendor === "openai") {
    // check if model is present as key in OPENAI_PRICING
    let correctModel = model;
    if (!OPENAI_PRICING.hasOwnProperty(model)) {
      if (model.includes("gpt-4")) {
        correctModel = "gpt-4";
      }
    }
    costTable = OPENAI_PRICING[correctModel];
  } else if (vendor === "anthropic") {
    let cmodel = "";
    if (model.includes("opus")) {
      cmodel = "claude-3-opus";
    } else if (model.includes("sonnet")) {
      cmodel = "claude-3-sonnet";
    } else if (model.includes("haiku")) {
      cmodel = "claude-3-haiku";
    } else if (model.includes("claude-2.1")) {
      cmodel = "claude-2.1";
    } else if (model.includes("claude-2.0")) {
      cmodel = "claude-2.0";
    } else if (model.includes("instant")) {
      cmodel = "claude-instant";
    } else {
      return 0;
    }
    costTable = ANTHROPIC_PRICING[cmodel];
  } else if (vendor === "perplexity") {
    costTable = PERPLEXITY_PRICING[model];
  } else if (vendor === "cohere") {
    costTable = COHERE_PRICING[model];
  }
  if (costTable) {
    const total =
      (costTable.input * usage?.input_tokens +
        costTable.output * usage?.output_tokens) /
      1000;
    const input = (costTable.input * usage?.input_tokens) / 1000;
    const output = (costTable.output * usage?.output_tokens) / 1000;
    return { total, input, output };
  }
  return { total: 0, input: 0, output: 0 };
}

export function extractSystemPromptFromLlmInputs(inputs: any[]): string {
  let prompt = "";
  for (let i = 0; i < inputs.length; i++) {
    const p = inputs[i];
    if (p?.role === "system") {
      prompt = p?.content || "";
      break;
    }
  }
  return prompt;
}

export const getChartColor = (value: number) => {
  if (value < 50) {
    return "red";
  } else if (value < 90 && value >= 50) {
    return "yellow";
  } else {
    return "green";
  }
};

export function safeStringify(value: any): string {
  if (!value) {
    return "";
  }

  // Check if the value is already a string
  if (typeof value === "string") {
    return value;
  }

  // if its a list, check type and stringify
  if (Array.isArray(value)) {
    const stringifiedList = value.map((item) => {
      if (item?.type === "text") {
        return item?.text;
      } else if (item?.type === "function") {
        return prettyPrintJson.toHtml(item);
      } else if (item?.type === "image_url") {
        if (typeof item?.image_url === "string") {
          return `<img src="${item?.image_url}" />`;
        } else if (typeof item?.image_url === "object") {
          return `<img src="${item?.image_url?.url}" />`;
        }
      }
      return item;
    });
    return stringifiedList.join("");
  }

  // If it's not a string, stringify it
  return prettyPrintJson.toHtml(value);
}

export function estimateTokens(prompt: string): number {
  if (prompt.length > 0) {
    // Simplified token estimation: count the words.
    return prompt.split(/\s+/).filter(Boolean).length;
  }
  return 0;
}

export function calculateTokens(content: string, model: string): number {
  try {
    let tiktokenModel: TiktokenEncoding = "cl100k_base";
    if (model.startsWith("gpt-4o")) {
      tiktokenModel = "o200k_base";
    }
    return estimateTokensUsingTikToken(content, tiktokenModel);
  } catch (error) {
    return estimateTokens(content); // Fallback method
  }
}

export function formatDurationForDisplay(hours: number): string {
  if (hours === 12) {
    return "last 12 hours";
  } else if (hours % 24 === 0) {
    const days = hours / 24;
    return `last ${days} day${days > 1 ? "s" : ""}`;
  } else {
    return `last ${hours} hours`;
  }
}

export function getFormattedTime(lastNHours: number): string {
  const nHoursAgo = format(
    new Date(Date.now() - lastNHours * 60 * 60 * 1000),
    "yyyy-MM-dd HH:mm:ss"
  );
  return nHoursAgo;
}

export function getVendorFromSpan(span: Span): string {
  const attributes = span.attributes ? JSON.parse(span.attributes) : {};
  let serviceName = "";
  if (attributes["langtrace.service.name"]) {
    serviceName = attributes["langtrace.service.name"].toLowerCase();
  }
  let vendor = "";
  if (span.name.includes("groq") || serviceName.includes("groq")) {
    vendor = "groq";
  } else if (
    span.name.includes("perplexity") ||
    serviceName.includes("perplexity")
  ) {
    vendor = "perplexity";
  } else if (span.name.includes("openai") || serviceName.includes("openai")) {
    vendor = "openai";
  } else if (
    span.name.includes("anthropic") ||
    serviceName.includes("anthropic")
  ) {
    vendor = "anthropic";
  } else if (
    span.name.includes("pinecone") ||
    serviceName.includes("pinecone")
  ) {
    vendor = "pinecone";
  } else if (
    span.name.includes("chromadb") ||
    serviceName.includes("chromadb")
  ) {
    vendor = "chromadb";
  } else if (
    span.name.includes("langchain") ||
    serviceName.includes("langchain")
  ) {
    vendor = "langchain";
  } else if (
    span.name.includes("llamaindex") ||
    serviceName.includes("llamaindex")
  ) {
    vendor = "llamaindex";
  } else if (span.name.includes("cohere") || serviceName.includes("cohere")) {
    vendor = "cohere";
  } else if (span.name.includes("qdrant") || serviceName.includes("qdrant")) {
    vendor = "qdrant";
  } else if (
    span.name.includes("weaviate") ||
    serviceName.includes("weaviate")
  ) {
    vendor = "weaviate";
  } else if (span.name.includes("pg") || serviceName.includes("pg")) {
    vendor = "pg";
  } else if (span.name.includes("dspy") || serviceName.includes("dspy")) {
    vendor = "dspy";
  } else if (span.name.includes("crewai") || serviceName.includes("crewai")) {
    vendor = "crewai";
  }
  return vendor;
}
