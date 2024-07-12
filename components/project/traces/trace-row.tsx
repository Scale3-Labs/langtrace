"use client";

import LanggraphView from "@/components/shared/langgraph-view";
import {
  calculateTotalTime,
  convertTracesToHierarchy,
  correctTimestampFormat,
} from "@/lib/trace_utils";
import { calculatePriceFromUsage, cn, formatDateTime } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { JsonView, allExpanded, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { HoverCell } from "../../shared/hover-cell";
import { LLMView } from "../../shared/llm-view";
import TraceGraph from "../../traces/trace_graph";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { LogsView } from "./logs-view";

export const TraceRow = ({
  trace,
  utcTime,
}: {
  trace: any;
  utcTime: boolean;
}) => {
  const traceHierarchy = convertTracesToHierarchy(trace);
  const totalTime = calculateTotalTime(trace);
  const startTime = trace[0].start_time;
  const [collapsed, setCollapsed] = useState(true);
  const [selectedTab, setSelectedTab] = useState("trace");
  const [selectedEvent, setSelectedEvent] = useState(0);

  // capture the token counts from the trace
  let tokenCounts: any = {};
  let model: string = "";
  let vendor: string = "";
  let userId: string = "";
  let promptId: string = "";
  let promptVersion: string = "";
  let prompts: any[] = [];
  let responses: any[] = [];
  let allEvents: any[] = [];
  let cost = { total: 0, input: 0, output: 0 };
  let langgraph = false;
  for (const span of trace) {
    if (span.attributes) {
      const attributes = JSON.parse(span.attributes);
      if (attributes["langtrace.service.name"]) {
        vendor = attributes["langtrace.service.name"].toLowerCase();
        if (vendor === "langgraph") {
          langgraph = true;
        }
      }
      userId = attributes["user_id"];
      // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
      if (attributes["llm.prompts"] && attributes["llm.responses"]) {
        prompts.push(attributes["llm.prompts"]);
        responses.push(attributes["llm.responses"]);
      }
      promptId = attributes["prompt_id"];
      promptVersion = attributes["prompt_version"];
      if (!model) {
        model =
          attributes["gen_ai.response.model"] ||
          attributes["llm.model"] ||
          attributes["gen_ai.request.model"] ||
          "";
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
        // TODO(Karthik): This logic is for handling old traces that were not compatible with the gen_ai conventions.
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

    if (span.events && span.events !== "[]") {
      const events = JSON.parse(span.events);
      const inputs = [];
      const outputs = [];
      allEvents.push(events);

      // find event with name 'gen_ai.content.prompt'
      const promptEvent = events.find(
        (event: any) => event.name === "gen_ai.content.prompt"
      );
      if (
        promptEvent &&
        promptEvent["attributes"] &&
        promptEvent["attributes"]["gen_ai.prompt"]
      ) {
        inputs.push(promptEvent["attributes"]["gen_ai.prompt"]);
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
        outputs.push(responseEvent["attributes"]["gen_ai.completion"]);
      }

      if (inputs.length > 0) {
        prompts.push(...inputs);
      } else {
        prompts.push('[{}]');
      }
      if (outputs.length > 0) {
        responses.push(...outputs);
      } else {
        responses.push('[{}]');
      }
    }
  }

  // Sort the trace based on start_time, then end_time
  trace.sort((a: any, b: any) => {
    if (a.start_time === b.start_time) {
      return a.end_time < b.end_time ? 1 : -1;
    }
    return a.start_time < b.start_time ? -1 : 1;
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn("grid-cols-13 grid items-center gap-6 cursor-pointer")}
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
            {formatDateTime(
              correctTimestampFormat(traceHierarchy[0].start_time),
              !utcTime
            )}
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
        <p className="text-xs font-semibold">{promptId}</p>
        <p className="text-xs font-semibold">{promptVersion}</p>
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
        <div className="flex flex-col">
          <div className="flex flex-row gap-2">
            <Button
              onClick={() => setSelectedTab("trace")}
              variant={"ghost"}
              className="flex flex-col justify-between pb-0"
            >
              <p
                className={
                  selectedTab === "trace"
                    ? "text-xs text-primary font-medium"
                    : "text-xs text-muted-foreground font-medium"
                }
              >
                Trace
              </p>
              {selectedTab === "trace" && (
                <Separator className="bg-primary h-[2px]" />
              )}
            </Button>
            <Button
              disabled={prompts.length === 0 && responses.length === 0}
              onClick={() => setSelectedTab("llm")}
              variant={"ghost"}
              className="flex flex-col justify-between pb-0"
            >
              <p
                className={
                  selectedTab === "llm"
                    ? "text-xs text-primary font-medium"
                    : "text-xs text-muted-foreground font-medium"
                }
              >
                LLM Requests
              </p>
              {selectedTab === "llm" && (
                <Separator className="bg-primary h-[2px]" />
              )}
            </Button>
            <Button
              onClick={() => setSelectedTab("logs")}
              variant={"ghost"}
              className="flex flex-col justify-between pb-0"
            >
              <p
                className={
                  selectedTab === "logs"
                    ? "text-xs text-primary font-medium"
                    : "text-xs text-muted-foreground font-medium"
                }
              >
                {`Logs  (${trace?.length ?? 0} total)`}
              </p>
              {selectedTab === "logs" && (
                <Separator className="bg-primary h-[2px]" />
              )}
            </Button>
            <Button
              disabled={allEvents.length === 0}
              onClick={() => setSelectedTab("events")}
              variant={"ghost"}
              className="flex flex-col justify-between pb-0"
            >
              <p
                className={
                  selectedTab === "events"
                    ? "text-xs text-primary font-medium"
                    : "text-xs text-muted-foreground font-medium"
                }
              >
                Events/Errors
              </p>
              {selectedTab === "events" && (
                <Separator className="bg-primary h-[2px]" />
              )}
            </Button>
            {langgraph && (
              <Button
                onClick={() => setSelectedTab("langgraph")}
                variant={"ghost"}
                className="flex flex-col justify-between pb-0"
              >
                <p
                  className={
                    selectedTab === "langgraph"
                      ? "text-xs text-primary font-medium"
                      : "text-xs text-muted-foreground font-medium"
                  }
                >
                  Langgraph
                </p>
                {selectedTab === "langgraph" && (
                  <Separator className="bg-primary h-[2px]" />
                )}
              </Button>
            )}
          </div>
          <Separator />
          {selectedTab === "trace" && (
            <TraceGraph
              totalSpans={trace.length}
              spans={traceHierarchy}
              totalTime={totalTime}
              startTime={startTime}
            />
          )}
          {selectedTab === "logs" && (
            <div className="flex flex-col px-4 mt-2">
              {trace.map((span: any, i: number) => {
                return <LogsView key={i} span={span} utcTime={utcTime} />;
              })}
            </div>
          )}
          {selectedTab === "events" && (
            <div className="flex flex-col gap-2 px-4 mt-2">
              <div className="flex flex-wrap items-center gap-2">
                {allEvents.map((event: any, i: number) => (
                  <Button
                    key={i}
                    size={"sm"}
                    variant={selectedEvent === i ? "secondary" : "outline"}
                    onClick={() => setSelectedEvent(i)}
                  >
                    Request {i + 1}
                  </Button>
                ))}
              </div>
              {allEvents[selectedEvent].length > 0 ? (
                allEvents[selectedEvent].map((event: any, i: number) => {
                  return (
                    <JsonView
                      key={i}
                      data={event}
                      shouldExpandNode={allExpanded}
                      style={defaultStyles}
                    />
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">No events found</p>
              )}
            </div>
          )}
          {selectedTab === "llm" && (
            <div className="flex flex-col px-4 mt-2">
              <LLMView prompts={prompts} responses={responses} />
            </div>
          )}
          {selectedTab === "langgraph" && (
            <div className="h-[500px]">
              <LanggraphView trace={trace} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
