"use client";

import {
  calculateTotalTime,
  convertTracesToHierarchy,
  correctTimestampFormat,
} from "@/lib/trace_utils";
import { calculatePriceFromUsage, formatDateTime } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import "react-json-view-lite/dist/index.css";
import { HoverCell } from "../../shared/hover-cell";
import { LLMView } from "../../shared/llm-view";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";

export const ConversationRow = ({
  trace,
  utcTime,
  importTrace = false,
  setMessages,
}: {
  trace: any;
  utcTime: boolean;
  importTrace?: boolean;
  setMessages?: (messages: any[]) => void;
}) => {
  const traceHierarchy = convertTracesToHierarchy(trace);
  const totalTime = calculateTotalTime(trace);
  const startTime = trace[0].start_time;
  const [collapsed, setCollapsed] = useState(true);

  // capture the token counts from the trace
  let tokenCounts: any = {};
  let model: string = "";
  let vendor: string = "";
  let userId: string = "";
  let prompts: any[] = [];
  let responses: any[] = [];
  let cost = { total: 0, input: 0, output: 0 };
  for (const span of trace) {
    if (span.attributes) {
      const attributes = JSON.parse(span.attributes);
      if (attributes["langtrace.service.name"]) {
        vendor = attributes["langtrace.service.name"].toLowerCase();
      }
      userId = attributes["user_id"];
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
          prompts.push(promptEvent["attributes"]["gen_ai.prompt"]);
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
          responses.push(responseEvent["attributes"]["gen_ai.completion"]);
        }
      }
      if (attributes["llm.prompts"] && attributes["llm.responses"]) {
        // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
        prompts.push(attributes["llm.prompts"]);
        responses.push(attributes["llm.responses"]);
      }
      if (!model) {
        model =
          attributes["gen_ai.request.model"] || attributes["llm.model"] || "";
      }
      if (
        attributes["gen_ai.usage.prompt_tokens"] &&
        attributes["gen_ai.usage.completion_tokens"]
      ) {
        tokenCounts = {
          input_tokens: tokenCounts.prompt_tokens
            ? tokenCounts.prompt_tokens +
              attributes["gen_ai.usage.prompt_tokens"]
            : attributes["gen_ai.usage.prompt_tokens"],
          output_tokens: tokenCounts.completion_tokens
            ? tokenCounts.completion_tokens +
              attributes["gen_ai.usage.completion_tokens"]
            : attributes["gen_ai.usage.completion_tokens"],
          total_tokens: tokenCounts.total_tokens
            ? tokenCounts.total_tokens +
              attributes["gen_ai.usage.prompt_tokens"] +
              attributes["gen_ai.usage.completion_tokens"]
            : attributes["gen_ai.usage.prompt_tokens"] +
              attributes["gen_ai.usage.completion_tokens"],
        };
        const currentcost = calculatePriceFromUsage(vendor, model, tokenCounts);
        // add the cost of the current span to the total cost
        cost.total += currentcost.total;
        cost.input += currentcost.input;
        cost.output += currentcost;
      } else if (attributes["llm.token.counts"]) {
        const currentcounts = JSON.parse(attributes["llm.token.counts"]);
        tokenCounts = {
          input_tokens: tokenCounts.input_tokens
            ? tokenCounts.input_tokens + currentcounts.input_tokens
            : currentcounts.input_tokens,
          output_tokens: tokenCounts.output_tokens
            ? tokenCounts.output_tokens + currentcounts.output_tokens
            : currentcounts.output_tokens,
          total_tokens: tokenCounts.total_tokens
            ? tokenCounts.total_tokens + currentcounts.total_tokens
            : currentcounts.total_tokens,
        };

        const currentcost = calculatePriceFromUsage(
          vendor,
          model,
          currentcounts
        );
        // add the cost of the current span to the total cost
        cost.total += currentcost.total;
        cost.input += currentcost.input;
        cost.output += currentcost.output;
      }
    }
  }

  if (prompts.length === 0 && responses.length === 0) {
    // if there are no prompts or responses, then it is likely that the trace is not an LLM trace
    return;
  }

  // Sort the trace based on start_time, then end_time
  trace.sort((a: any, b: any) => {
    if (a.start_time === b.start_time) {
      return a.end_time < b.end_time ? 1 : -1;
    }
    return a.start_time < b.start_time ? -1 : 1;
  });

  return (
    <div className="flex flex-col gap-3 py-3">
      <div
        className={"grid-cols-12 grid items-center gap-6 cursor-pointer"}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex flex-row items-center gap-2">
          <Button
            variant={"ghost"}
            size={"icon"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed && (
              <ChevronRight className="text-muted-foreground w-5 h-5" />
            )}
            {!collapsed && (
              <ChevronDown className="text-muted-foreground w-5 h-5" />
            )}
          </Button>
          <p className="text-xs text-muted-foreground font-semibold">
            {formatDateTime(correctTimestampFormat(startTime), !utcTime)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {traceHierarchy[0].status_code !== "ERROR" && (
            <Separator
              orientation="vertical"
              className="bg-green-400 h-6 w-1 rounded-md"
            />
          )}
          {traceHierarchy[0].status_code === "ERROR" && (
            <Separator
              orientation="vertical"
              className="bg-red-400 h-6 w-1 rounded-md"
            />
          )}
          <p className="text-xs font-semibold truncate">
            {traceHierarchy[0].name}
          </p>
        </div>
        <p className="text-xs font-semibold">{model}</p>
        {prompts?.length > 0 ? (
          <HoverCell
            values={JSON.parse(prompts[0])}
            className="flex items-center max-w-fit text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
          />
        ) : (
          <p className="text-xs font-semibold col-span-2"></p>
        )}
        {responses?.length > 0 ? (
          <HoverCell
            values={JSON.parse(responses[0])}
            className="flex items-center max-w-fit text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
          />
        ) : (
          <p className="text-xs font-semibold col-span-2"></p>
        )}
        <p className="text-xs font-semibold">{userId}</p>
        <p className="text-xs">
          {tokenCounts?.input_tokens || tokenCounts?.prompt_tokens}
          {tokenCounts?.input_tokens || tokenCounts?.prompt_tokens ? "/" : ""}
          {tokenCounts?.output_tokens || tokenCounts?.completion_tokens}
          {tokenCounts?.output_tokens || tokenCounts?.completion_tokens
            ? "/"
            : ""}
          {tokenCounts?.total_tokens}
        </p>
        <p className="text-xs font-semibold">
          {cost.total.toFixed(6) !== "0.000000"
            ? `\$${cost.total.toFixed(6)}`
            : ""}
        </p>
        <div className="text-xs text-muted-foreground font-semibold">
          {totalTime}ms
        </div>
      </div>
      {!collapsed && (
        <div className="flex flex-col px-4 mt-2">
          <LLMView
            prompts={prompts}
            responses={responses}
            importTrace={importTrace}
            setMessages={setMessages}
          />
        </div>
      )}
      <Separator />
    </div>
  );
};
