"use client";

import { PAGE_SIZE } from "@/lib/constants";
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
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import SetupInstructions from "../shared/setup-instructions";
import { Spinner } from "../shared/spinner";
import { serviceTypeColor, vendorBadgeColor } from "../shared/vendor-metadata";
import TraceGraph from "../traces/trace_graph";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function Traces({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showLoader, setShowLoader] = useState(false);

  const fetchProject = useQuery({
    queryKey: ["fetch-project-query"],
    queryFn: async () => {
      const response = await fetch(`/api/project?id=${project_id}`);
      const result = await response.json();
      return result;
    },
  });

  useBottomScrollListener(() => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchTraces.refetch();
    }
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
      const response = await fetch(
        `/api/trace?projectId=${project_id}&page=${page}&pageSize=${PAGE_SIZE}`
      );
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
      console.log("currentData", currentData);
      console.log("newData", newData);
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
      setShowLoader(false);
    },
    refetchOnWindowFocus: false,
  });

  if (
    fetchProject.isLoading ||
    !fetchProject.data ||
    fetchUser.isLoading ||
    !fetchUser.data ||
    fetchTraces.isLoading ||
    !fetchTraces.data ||
    !currentData
  ) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full py-6 px-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
        <div className="grid grid-cols-2 items-center gap-48 p-3 bg-muted">
          <div className="grid grid-cols-2 gap-3 items-center">
            <p className="ml-10 text-xs font-medium">Timestamp (UTC)</p>
            <p className="text-xs font-medium">Namespace</p>
          </div>
          <div className="grid grid-cols-4 gap-3 items-center">
            <p className="text-xs font-medium">User ID</p>
            <p className="text-xs font-medium">Input / Output / Total Tokens</p>
            <p className="text-xs font-medium">Token Cost</p>
            <p className="text-xs font-medium">Duration(ms)</p>
          </div>
        </div>
        {!fetchTraces.isLoading &&
          fetchTraces.data &&
          currentData.map((trace: any, i: number) => {
            return (
              <div key={i} className="flex flex-col gap-3 px-3">
                <TraceRow trace={trace} /> <Separator />
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
          currentData.length === 0 && (
            <div className="flex flex-col gap-3 items-center justify-center p-4">
              <p className="text-muted-foreground text-sm mb-3">
                No traces available. Get started by setting up Langtrace in your
                application.
              </p>
              <SetupInstructions project_id={project_id} />
            </div>
          )}
      </div>
    </div>
  );
}

const TraceRow = ({ trace }: { trace: any }) => {
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
  let cost = { total: 0, input: 0, output: 0 };
  for (const span of trace) {
    if (span.attributes) {
      const attributes = JSON.parse(span.attributes);
      userId = attributes["user.id"];
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
        className="grid grid-cols-2 items-center gap-48 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="grid grid-cols-2 gap-0 items-center">
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
                correctTimestampFormat(traceHierarchy[0].start_time)
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
        </div>
        <div className="grid grid-cols-4 font-semibold">
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
                return <LogsView key={i} span={span} />;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LogsView = ({ span }: { span: any }) => {
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
          {formatDateTime(correctTimestampFormat(span.start_time))}
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
        <pre className="text-xs bg-muted p-2 rounded-md">
          {parseNestedJsonFields(span.attributes)}
        </pre>
      )}
      <Separator />
    </div>
  );
};
