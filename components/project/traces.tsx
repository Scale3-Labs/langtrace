"use client";

import { PAGE_SIZE } from "@/lib/constants";
import { AttributesFilter } from "@/lib/services/query_builder_service";
import {
  calculateTotalTime,
  convertTracesToHierarchy,
  correctTimestampFormat,
} from "@/lib/trace_utils";
import {
  calculatePriceFromUsage,
  cn,
  formatDateTime,
  parseNestedJsonFields,
} from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { HoverCell } from "../shared/hover-cell";
import { LLMView } from "../shared/llm-view";
import { SetupInstructions } from "../shared/setup-instructions";
import { Spinner } from "../shared/spinner";
import { serviceTypeColor, vendorBadgeColor } from "../shared/vendor-metadata";
import TraceGraph from "../traces/trace_graph";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";

export default function Traces({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showLoader, setShowLoader] = useState(false);
  const [filters, setFilters] = useState<AttributesFilter[]>([]);
  const [enableFetch, setEnableFetch] = useState(false);
  const [utcTime, setUtcTime] = useState(true);

  useEffect(() => {
    setShowLoader(true);
    setCurrentData([]);
    setPage(1);
    setTotalPages(1);
    setEnableFetch(true);
  }, [filters]);

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchTraces.refetch();
    }
  });

  const fetchProject = useQuery({
    queryKey: ["fetch-project-query"],
    queryFn: async () => {
      const response = await fetch(`/api/project?id=${project_id}`);
      const result = await response.json();
      return result;
    },
  });

  const fetchUser = useQuery({
    queryKey: ["fetch-user-query"],
    queryFn: async () => {
      const response = await fetch(`/api/user?email=${email}`);
      const result = await response.json();
      return result;
    },
  });

  const fetchTraces = useQuery({
    queryKey: ["fetch-traces-query"],
    queryFn: async () => {
      // convert filterserviceType to a string
      const apiEndpoint = "/api/traces";
      const body = {
        page,
        pageSize: PAGE_SIZE,
        projectId: project_id,
        filters: filters,
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const newData = data?.traces?.result || [];
      const metadata = data?.traces?.metadata || {};

      // Update the total pages and current page number
      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      // Merge the new data with the existing data
      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];

        // TODO(Karthik): The results are an array of span arrays, so
        // we need to figure out how to merge them correctly.
        // Remove duplicates
        // const uniqueData = updatedData.filter(
        //   (v: any, i: number, a: any) =>
        //     a.findIndex((t: any) => t.span_id === v.span_id) === i
        // );

        setCurrentData(updatedData);
      } else {
        setCurrentData(newData);
      }

      setEnableFetch(false);
      setShowLoader(false);
    },
    refetchOnWindowFocus: false,
    enabled: enableFetch,
  });

  const FILTERS = [
    {
      key: "llm",
      value: "LLM Requests",
    },
    {
      key: "vectordb",
      value: "VectorDB Requests",
    },
    {
      key: "framework",
      value: "Framework Requests",
    },
  ];

  return (
    <div className="w-full py-6 px-6 flex flex-col gap-4">
      <div className="flex justify-between items-center px-12 bg-muted py-4 rounded-md">
        <div className="flex gap-8 items-center">
          {FILTERS.map((item, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Checkbox
                disabled={showLoader}
                id={item.key}
                checked={filters.some((filter) => filter.value === item.key)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilters([
                      ...filters,
                      {
                        key: "langtrace.service.type",
                        operation: "EQUALS",
                        value: item.key,
                      },
                    ]);
                  } else {
                    setFilters(
                      filters.filter((filter) => filter.value !== item.key)
                    );
                  }
                }}
              />
              <label htmlFor={item.key} className="text-xs font-semibold">
                {item.value}
              </label>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Label>Local time</Label>
          <Switch
            id="timestamp"
            checked={utcTime}
            onCheckedChange={(check) => setUtcTime(check)}
          />
          <Label>UTC</Label>
        </div>
      </div>
      <div className="grid grid-cols-11 items-center gap-6 p-3 bg-muted">
        <p className="ml-10 text-xs font-medium">Timestamp (UTC)</p>
        <p className="text-xs font-medium">Namespace</p>
        <p className="text-xs font-medium">Model</p>
        <p className="text-xs font-medium col-span-2">Input</p>
        <p className="text-xs font-medium col-span-2">Output</p>
        <p className="text-xs font-medium">User ID</p>
        <p className="text-xs font-medium">Input / Output / Total Tokens</p>
        <p className="text-xs font-medium">Token Cost</p>
        <p className="text-xs font-medium">Duration(ms)</p>
      </div>
      {fetchProject.isLoading ||
      !fetchProject.data ||
      fetchUser.isLoading ||
      !fetchUser.data ||
      fetchTraces.isLoading ||
      !fetchTraces.data ||
      !currentData ? (
        <div>Loading...</div>
      ) : (
        <div
          className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll"
          ref={scrollableDivRef as any}
        >
          {!fetchTraces.isLoading &&
            fetchTraces.data &&
            currentData.map((trace: any, i: number) => {
              return (
                <div key={i} className="flex flex-col gap-3 px-3">
                  <TraceRow trace={trace} utcTime={utcTime} /> <Separator />
                </div>
              );
            })}
          {showLoader && (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-center" />
            </div>
          )}
          {!fetchTraces.isLoading &&
            fetchTraces.data &&
            currentData.length === 0 &&
            !showLoader && (
              <div className="flex flex-col gap-3 items-center justify-center p-4">
                <p className="text-muted-foreground text-sm mb-3">
                  No traces available. Get started by setting up Langtrace in
                  your application.
                </p>
                <SetupInstructions project_id={project_id} />
              </div>
            )}
        </div>
      )}
    </div>
  );
}

const TraceRow = ({ trace, utcTime }: { trace: any; utcTime: boolean }) => {
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
          className="text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
        />
        <HoverCell
          value={
            responses?.length > 0
              ? JSON.parse(responses)[0]?.message?.content ||
                JSON.parse(responses)[0]?.text ||
                JSON.parse(responses)[0]?.content
              : ""
          }
          className="text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
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

const LogsView = ({ span, utcTime }: { span: any; utcTime: boolean }) => {
  const [collapsed, setCollapsed] = useState(true);
  const servTypeColor = serviceTypeColor(
    JSON.parse(span.attributes)["langtrace.service.type"]
  );

  const servColor = vendorBadgeColor(
    JSON.parse(span.attributes)["langtrace.service.name"]?.toLowerCase()
  );
  return (
    <div className="flex flex-col">
      <div
        className="flex flex-row items-center gap-3 cursor-pointer hover:bg-muted rounded-md"
        onClick={() => setCollapsed(!collapsed)}
      >
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
        <p className="text-xs font-semibold">
          {formatDateTime(correctTimestampFormat(span.start_time), !utcTime)}
        </p>
        <p className="text-xs bg-muted p-1 rounded-md font-semibold">
          {span.name}
        </p>
        {JSON.parse(span.attributes)["langtrace.service.type"] && (
          <p
            className={cn(
              "text-xs font-semibold text-white bg-muted p-1 rounded-md",
              servTypeColor
            )}
          >
            {JSON.parse(span.attributes)["langtrace.service.type"]}
          </p>
        )}
        {JSON.parse(span.attributes)["langtrace.service.name"] && (
          <p
            className={cn(
              "text-xs bg-muted p-1 rounded-md text-white font-semibold",
              servColor
            )}
          >
            {JSON.parse(span.attributes)["langtrace.service.name"]}
          </p>
        )}
        {JSON.parse(span.attributes)["langtrace.service.version"] && (
          <p className="text-xs bg-muted-foreground p-1 rounded-md text-white font-semibold">
            {JSON.parse(span.attributes)["langtrace.service.version"]}
          </p>
        )}
        {JSON.parse(span.attributes)["langtrace.service.type"] === "llm" && (
          <p
            className={cn(
              "text-xs font-semibold text-white bg-muted p-1 rounded-md",
              servTypeColor
            )}
          >
            {JSON.parse(span.attributes)["llm.model"]}
          </p>
        )}
      </div>
      {!collapsed && (
        <pre className="text-xs bg-muted p-2 rounded-md whitespace-pre-wrap">
          {parseNestedJsonFields(span.attributes)}
        </pre>
      )}
      <Separator />
    </div>
  );
};
