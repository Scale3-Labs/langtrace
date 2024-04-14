"use client";

import {
  calculateTotalTime,
  convertTracesToHierarchy,
  correctTimestampFormat,
} from "@/lib/trace_utils";
import { calculatePriceFromUsage, formatDateTime } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
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

  // capture the token counts from the trace
  let tokenCounts: any = {};
  let model: string = "";
  let vendor: string = "";
  let userId: string = "";
  let prompts: any = {};
  let responses: any = {};
  let cost = { total: 0, input: 0, output: 0 };
  for (const span of trace) {
    if (span.attributes) {
      const attributes = JSON.parse(span.attributes);
      userId = attributes["user.id"];
      if (attributes["llm.prompts"] && attributes["llm.responses"]) {
        prompts = attributes["llm.prompts"];
        responses = attributes["llm.responses"];
      }
      if (attributes["llm.token.counts"]) {
        model = attributes["llm.model"];
        vendor = attributes["langtrace.service.name"].toLowerCase();
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
        className="grid grid-cols-11 items-center gap-6 cursor-pointer"
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
          {traceHierarchy[0].status !== "ERROR" && (
            <Separator
              orientation="vertical"
              className="bg-green-400 h-6 w-1 rounded-md"
            />
          )}
          {traceHierarchy[0].status === "ERROR" && (
            <Separator
              orientation="vertical"
              className="bg-red-400 h-6 w-1 rounded-md"
            />
          )}
          <p className="text-xs font-semibold">{traceHierarchy[0].name}</p>
        </div>
        <p className="text-xs font-semibold">{model}</p>
        <HoverCell
          value={prompts?.length > 0 ? JSON.parse(prompts)[0]?.content : ""}
          className="w-fit text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
        />
        <HoverCell
          value={
            responses?.length > 0
              ? JSON.parse(responses)[0]?.message?.content ||
                JSON.parse(responses)[0]?.text ||
                JSON.parse(responses)[0]?.content
              : ""
          }
          className="w-fit text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
        />
        <p className="text-xs font-semibold">{userId}</p>
        <div className="flex flex-row items-center gap-3">
          <p className="text-xs">
            {tokenCounts?.input_tokens || tokenCounts?.prompt_tokens}
          </p>
          {tokenCounts?.input_tokens || tokenCounts?.prompt_tokens ? "+" : ""}
          <p className="text-xs">
            {tokenCounts?.output_tokens || tokenCounts?.completion_tokens}{" "}
          </p>
          {tokenCounts?.output_tokens || tokenCounts?.completion_tokens
            ? "="
            : ""}
          <p className="text-xs">{tokenCounts?.total_tokens}</p>
        </div>
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
            <Button
              disabled={
                Object.keys(prompts).length === 0 ||
                Object.keys(responses).length === 0
              }
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
          {selectedTab === "llm" && (
            <div className="flex flex-col px-4 mt-2">
              <LLMView prompts={prompts} responses={responses} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
