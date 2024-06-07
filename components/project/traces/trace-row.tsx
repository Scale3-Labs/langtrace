"use client";

import LanggraphView from "@/components/shared/langgraph-view";
import {
  calculateTotalTime,
  convertTracesToHierarchy,
  correctTimestampFormat,
} from "@/lib/trace_utils";
import { calculatePriceFromUsage, formatDateTime } from "@/lib/utils";
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
  importTrace = false,
  setSelectedPrompt,
}: {
  trace: any;
  utcTime: boolean;
  importTrace?: boolean;
  setSelectedPrompt?: (prompt: string) => void;
}) => {
  const traceHierarchy = convertTracesToHierarchy(trace);
  const totalTime = calculateTotalTime(trace);
  const startTime = trace[0].start_time;
  const [collapsed, setCollapsed] = useState(true);
  const [selectedTab, setSelectedTab] = useState("trace");

  // capture the token counts from the trace
  let tokenCounts: any = {};
  let model: string = "";
  let vendor: string = "";
  let userId: string = "";
  let prompts: any[] = [];
  let responses: any[] = [];
  let events: any[] = [];
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
      userId = attributes["user.id"];
      if (attributes["llm.prompts"] && attributes["llm.responses"]) {
        prompts.push(attributes["llm.prompts"]);
        responses.push(attributes["llm.responses"]);
      }
      if (!model) {
        model = attributes["llm.model"] || "";
      }
      if (attributes["llm.token.counts"]) {
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

    if (span.events) {
      events = JSON.parse(span.events);
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
        className={
          importTrace
            ? "grid grid-cols-12 items-center gap-6 cursor-pointer"
            : "grid grid-cols-11 items-center gap-6 cursor-pointer"
        }
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
        <HoverCell
          values={prompts?.length > 0 ? JSON.parse(prompts[0]) : []}
          className="flex items-center max-w-fit text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
        />
        <HoverCell
          values={responses?.length > 0 ? JSON.parse(responses[0]) : []}
          className="flex items-center max-w-fit text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
        />
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
        <div className="flex flex-col">
          <div className="flex flex-row gap-2">
            {!importTrace && (
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
            )}
            {!importTrace && (
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
                  Logs
                </p>
                {selectedTab === "logs" && (
                  <Separator className="bg-primary h-[2px]" />
                )}
              </Button>
            )}
            {!importTrace && (
              <Button
                disabled={events.length === 0}
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
                  Events
                </p>
                {selectedTab === "events" && (
                  <Separator className="bg-primary h-[2px]" />
                )}
              </Button>
            )}
            <Button
              disabled={prompts.length === 0 || responses.length === 0}
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
            {langgraph && !importTrace && (
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
          {selectedTab === "trace" && !importTrace && (
            <TraceGraph
              totalSpans={trace.length}
              spans={traceHierarchy}
              totalTime={totalTime}
              startTime={startTime}
            />
          )}
          {selectedTab === "logs" && !importTrace && (
            <div className="flex flex-col px-4 mt-2">
              {trace.map((span: any, i: number) => {
                return <LogsView key={i} span={span} utcTime={utcTime} />;
              })}
            </div>
          )}
          {selectedTab === "events" && !importTrace && (
            <div className="flex flex-col px-4 mt-2">
              {events.map((event: any, i: number) => {
                return (
                  <JsonView
                    key={i}
                    data={event}
                    shouldExpandNode={allExpanded}
                    style={defaultStyles}
                  />
                );
              })}
            </div>
          )}
          {(selectedTab === "llm" || importTrace) && (
            <div className="flex flex-col px-4 mt-2">
              <LLMView
                prompts={prompts}
                responses={responses}
                importTrace={importTrace}
                setSelectedPrompt={setSelectedPrompt}
              />
            </div>
          )}
          {selectedTab === "langgraph" && !importTrace && (
            <div className="h-[500px]">
              <LanggraphView trace={trace} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
