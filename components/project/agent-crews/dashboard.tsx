"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_SIZE, RECIPE_DOCS } from "@/lib/constants";
import { CrewAITrace, processCrewAITrace } from "@/lib/crewai_trace_util";
import { cn } from "@/lib/utils";
import { ArrowTopRightIcon, GearIcon } from "@radix-ui/react-icons";
import {
  BotIcon,
  BrainCircuitIcon,
  ChevronLeftSquareIcon,
  ChevronRightSquareIcon,
  FileIcon,
  RefreshCwIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { TraceComponent } from "../traces/trace-component";
import { AgentsView, MemoryView, TasksView, ToolsView } from "./agents-view";
import TimelineChart from "./timeline-chart";

export default function AgentCrewsDashboard({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [cachedCurrentPage, setCachedCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<CrewAITrace[]>([]);
  const [enableFetch, setEnableFetch] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<CrewAITrace | null>(null);
  const [selectedTraceIndex, setSelectedTraceIndex] = useState<number>(0);

  useEffect(() => {
    setEnableFetch(true);
  }, []);

  const fetchOldTraces = () => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      fetchTraces.refetch();
    }
  };

  const fetchLatestTraces = () => {
    if (fetchTraces.isRefetching) {
      return;
    }
    setCachedCurrentPage(page);
    setPage(1);
    setEnableFetch(true);
  };

  const fetchTracesCall = useCallback(
    async (pageNum: number) => {
      const apiEndpoint = "/api/traces";

      const body = {
        page: pageNum,
        pageSize: PAGE_SIZE,
        projectId: project_id,
        filters: {
          filters: [
            {
              key: "langtrace.service.version",
              operation: "NOT_EQUALS",
              value: "",
              type: "attribute",
            },
          ],
          operation: "OR",
        },
        group: true,
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch traces");
      }
      return await response.json();
    },
    [project_id]
  );

  const fetchTraces = useQuery({
    queryKey: ["fetch-traces-query", page],
    queryFn: () => fetchTracesCall(page),
    onSuccess: (data) => {
      const newData = data?.traces?.result || [];
      const metadata = data?.traces?.metadata || {};

      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      let transformedNewData: CrewAITrace[] = [];
      transformedNewData = newData.map((trace: any) => {
        return processCrewAITrace(trace);
      });

      if (page === 1 && currentData.length === 0) {
        setCurrentData(transformedNewData);
        if (transformedNewData.length > 0)
          setSelectedTrace(transformedNewData[0]);
      } else {
        if (page === 1) {
          // deduplicate transformedNewData with currentData
          const currentDataIds = currentData.map((trace: any) => trace.id);
          transformedNewData = transformedNewData.filter(
            (trace: any) => !currentDataIds.includes(trace.id)
          );
          setCurrentData((prevData: any) => [
            ...transformedNewData,
            ...prevData,
          ]);
          setPage(cachedCurrentPage);
        } else {
          setCurrentData((prevData: any) => [
            ...prevData,
            ...transformedNewData,
          ]);
        }
      }

      setEnableFetch(false);
    },
    onError: (error) => {
      setEnableFetch(false);
      toast.error("Failed to fetch traces", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    refetchOnWindowFocus: false,
    enabled: enableFetch,
  });

  if (fetchTraces.isLoading && currentData.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="w-full py-6 px-6 flex flex-col gap-3">
      <div className="flex flex-col">
        <div className="flex gap-3 items-center">
          <Image
            alt="CrewAI Logo"
            src="/crewai.png"
            width={60}
            height={30}
            className={"rounded-md"}
          />
          <p className="text-2xl font-semibold">Sessions</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Read latest from right to left
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <Button variant="outline" size={"icon"} onClick={fetchLatestTraces}>
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
          <p
            className={cn(
              "text-xs font-semibold",
              fetchTraces.isFetching
                ? "text-orange-500"
                : "text-muted-foreground"
            )}
          >
            {fetchTraces.isFetching
              ? "Fetching sessions..."
              : `Fetched the last ${currentData.length} sessions`}
          </p>
        </div>
        <div className="flex gap-1 items-center">
          <p className="text-xs font-semibold text-muted-foreground">
            Use arrow keys to navigate through traces timeline
          </p>
          <ChevronLeftSquareIcon className="w-6 h-6 text-muted-foreground" />
          <ChevronRightSquareIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
      {(!currentData || currentData.length === 0) && (
        <div className="flex flex-col gap-2 mt-12 w-full items-center justify-center">
          <p className="text-sm font-semibold text-muted-foreground">
            No crew sessions found.
          </p>
          <Link href={RECIPE_DOCS["crewai"]} target="_blank">
            <Button size={"sm"}>
              Learn how to create a crew session
              <ArrowTopRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
      {currentData && currentData.length > 0 && (
        <TimelineChart
          setSelectedTrace={setSelectedTrace}
          selectedTrace={selectedTrace}
          selectedTraceIndex={selectedTraceIndex}
          setSelectedTraceIndex={setSelectedTraceIndex}
          data={currentData}
          fetchOldTraces={fetchOldTraces}
          fetchLatestTraces={fetchLatestTraces}
          fetching={fetchTraces.isFetching}
        />
      )}
      {selectedTrace && (
        <>
          <div className="flex gap-3 items-stretch">
            <Card className="w-1/4">
              <CardHeader>
                <CardTitle className="text-xl">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <p className="text-xs font-semibold">STATUS</p>
                <Badge
                  variant={"secondary"}
                  className={cn(
                    "w-fit",
                    selectedTrace?.status === "success"
                      ? "bg-green-600"
                      : "bg-destructive"
                  )}
                >
                  {selectedTrace?.status}
                </Badge>
                <p className="text-xs font-semibold">CREW ID</p>
                <Badge variant={"secondary"} className="w-fit">
                  {selectedTrace?.crew?.id || "N/A"}
                </Badge>
                <p className="text-xs font-semibold">START TIME</p>
                <Badge variant={"secondary"} className="w-fit">
                  {selectedTrace?.formatted_start_time || "N/A"}
                </Badge>
                <p className="text-xs font-semibold">TOTAL DURATION</p>
                <Badge variant={"secondary"} className="w-fit">
                  {selectedTrace?.total_duration.toLocaleString()} ms
                </Badge>
              </CardContent>
            </Card>
            <Card className="w-1/4">
              <CardHeader>
                <CardTitle className="text-xl">Usage Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold mt-2">Input</p>
                    {selectedTrace?.input_tokens && (
                      <Badge variant={"secondary"} className="w-fit mt-2">
                        Tokens: {selectedTrace?.input_tokens.toLocaleString()}
                      </Badge>
                    )}
                    {selectedTrace?.input_cost && (
                      <Badge variant={"secondary"} className="w-fit mt-2">
                        Cost: ${selectedTrace?.input_cost.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold mt-2">Output</p>
                    {selectedTrace?.output_tokens && (
                      <Badge variant={"secondary"} className="w-fit mt-2">
                        Tokens: {selectedTrace?.output_tokens.toLocaleString()}
                      </Badge>
                    )}
                    {selectedTrace?.output_cost && (
                      <Badge variant={"secondary"} className="w-fit mt-2">
                        Cost: ${selectedTrace?.output_cost.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold mt-2">Total</p>
                    {selectedTrace?.total_tokens && (
                      <Badge variant={"secondary"} className="w-fit mt-2">
                        Tokens: {selectedTrace?.total_tokens.toLocaleString()}
                      </Badge>
                    )}
                    {selectedTrace?.total_cost && (
                      <Badge variant={"secondary"} className="w-fit mt-2">
                        Cost: ${selectedTrace?.total_cost.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="w-1/4">
              <CardHeader>
                <CardTitle className="text-xl">Libraries Detected</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTrace?.libraries.map((library, i) => {
                  return (
                    <div className="grid grid-cols-2 gap-3" key={i}>
                      <p className="text-xs font-semibold mt-2">
                        {library.name}
                      </p>
                      <Badge variant={"secondary"} className="w-fit mt-2">
                        {library.version}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-3 items-stretch">
            <Card className="w-1/2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-1">
                  <BotIcon className="w-6 h-6" />
                  Agent Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 min-h-fit max-h-[500px] overflow-y-scroll">
                {selectedTrace?.agents.length > 0 ? (
                  <AgentsView agents={selectedTrace?.agents} />
                ) : (
                  <p className="text-xs font-semibold">No agents detected</p>
                )}
              </CardContent>
            </Card>
            <Card className="w-1/2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-1">
                  <FileIcon className="w-6 h-6" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 min-h-fit max-h-[500px] overflow-y-scroll">
                {selectedTrace?.tasks.length > 0 ? (
                  <TasksView tasks={selectedTrace?.tasks} />
                ) : (
                  <p className="text-xs font-semibold">No tasks detected</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-3 items-stretch">
            <Card className="w-1/2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-1">
                  <GearIcon className="w-6 h-6" />
                  Tool Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 min-h-fit max-h-[500px] overflow-y-scroll">
                {selectedTrace?.tools.length > 0 ? (
                  <ToolsView tools={selectedTrace?.tools} />
                ) : (
                  <p className="text-xs font-semibold">No tools detected</p>
                )}
              </CardContent>
            </Card>
            <Card className="w-1/2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-1">
                  <BrainCircuitIcon className="w-6 h-6" />
                  Memory Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 min-h-fit max-h-[500px] overflow-y-scroll">
                {selectedTrace?.memory.length > 0 ? (
                  <MemoryView memory={selectedTrace?.memory} />
                ) : (
                  <p className="text-xs font-semibold">No memory detected</p>
                )}
              </CardContent>
            </Card>
          </div>
          <TraceComponent trace={selectedTrace} project_id={project_id} />
        </>
      )}
    </div>
  );
}

function PageLoading() {
  return (
    <div className="w-full py-6 px-6 flex flex-col gap-3">
      <div className="flex flex-col">
        <div className="flex gap-3 items-center">
          <Image
            alt="CrewAI Logo"
            src="/crewai.png"
            width={60}
            height={30}
            className={"rounded-md"}
          />
          <p className="text-2xl font-semibold">Sessions</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Read latest from right to left
        </p>
      </div>
      <Skeleton className="w-full h-10 rounded-md" />
      <Skeleton className="w-full h-56 rounded-md" />
      <div className="flex gap-3 items-center">
        <Skeleton className="w-1/4 h-56 rounded-md" />
        <Skeleton className="w-1/4 h-56 rounded-md" />
        <Skeleton className="w-1/4 h-56 rounded-md" />
      </div>
      <div className="flex items-center gap-3 justify-between">
        <Skeleton className="w-1/2 h-56 rounded-md" />
        <Skeleton className="w-1/2 h-56 rounded-md" />
      </div>
      <Skeleton className="w-1/2 h-56 rounded-md" />
      <Skeleton className="w-full h-96 rounded-md" />
    </div>
  );
}
