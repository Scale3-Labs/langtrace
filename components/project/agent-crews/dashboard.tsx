"use client";

import { Info } from "@/components/shared/info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAGE_SIZE } from "@/lib/constants";
import { CrewAITrace, processCrewAITrace } from "@/lib/crewai_trace_util";
import { cn } from "@/lib/utils";
import { RefreshCwIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { Switch } from "../../ui/switch";
import { TraceComponent } from "../traces/trace-component";
import { AgentsView, TasksView } from "./agents-view";
import TimelineChart from "./timeline-chart";

export default function AgentCrewsDashboard({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [cachedCurrentPage, setCachedCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<CrewAITrace[]>([]);
  const [enableFetch, setEnableFetch] = useState(false);
  const [utcTime, setUtcTime] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<CrewAITrace | null>(null);

  useEffect(() => {
    setEnableFetch(true);

    // fetch preferences from local storage
    if (typeof window !== "undefined") {
      const utc = window.localStorage.getItem("preferences.timestamp.utc");
      setUtcTime(utc === "true");
    }
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

  return (
    <div className="w-full py-6 px-6 flex flex-col gap-3">
      <div className="flex justify-between items-center px-12 bg-muted py-4 rounded-md">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-semibold">
            Preferences
          </p>
          <div className="flex gap-2 items-center w-full">
            <p className="text-xs font-semibold">Local time</p>
            <Switch
              className="text-start"
              id="timestamp"
              checked={utcTime}
              onCheckedChange={(check) => {
                setUtcTime(check);

                // Save the preference in local storage
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(
                    "preferences.timestamp.utc",
                    check ? "true" : "false"
                  );
                  toast.success("Preferences updated.");
                }
              }}
            />
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold">UTC</p>
              <Info information="By default all the spans are recorded in UTC timezone for the sake of standardization. By toggling this setting, you can visualize the spans in your local timezone." />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <Button variant="outline" size={"icon"} onClick={fetchLatestTraces}>
          <RefreshCwIcon className="w-4 h-4" />
        </Button>
        <p
          className={cn(
            "text-xs font-semibold",
            fetchTraces.isFetching ? "text-orange-500" : "text-muted-foreground"
          )}
        >
          {fetchTraces.isFetching
            ? "Fetching traces..."
            : `Fetched the last ${currentData.length} traces`}
        </p>
      </div>
      <div className="flex flex-col">
        <p className="text-xl">Agent Sessions</p>
        <p className="text-sm text-muted-foreground">
          Read latest from right to left
        </p>
      </div>
      <TimelineChart
        setSelectedTrace={setSelectedTrace}
        selectedTrace={selectedTrace}
        data={currentData}
        fetchOldTraces={fetchOldTraces}
        fetchLatestTraces={fetchLatestTraces}
        fetching={fetchTraces.isFetching}
      />
      {selectedTrace && (
        <>
          <div className="flex gap-3 items-stretch">
            <Card>
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
                  {selectedTrace?.crew.id}
                </Badge>
                <p className="text-xs font-semibold">START TIME</p>
                <Badge variant={"secondary"} className="w-fit">
                  {selectedTrace?.formatted_start_time}
                </Badge>
                <p className="text-xs font-semibold">TOTAL DURATION</p>
                <Badge variant={"secondary"} className="w-fit">
                  {selectedTrace?.total_duration.toLocaleString()} ms
                </Badge>
              </CardContent>
            </Card>
            <Card>
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
                <CardTitle className="text-xl">Agent Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {selectedTrace?.agents.length > 0 ? (
                  <AgentsView agents={selectedTrace?.agents} />
                ) : (
                  <p className="text-xs font-semibold">No agents detected</p>
                )}
              </CardContent>
            </Card>
            <Card className="w-1/2">
              <CardHeader>
                <CardTitle className="text-xl">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {selectedTrace?.tasks.length > 0 ? (
                  <TasksView tasks={selectedTrace?.tasks} />
                ) : (
                  <p className="text-xs font-semibold">No tasks detected</p>
                )}
              </CardContent>
            </Card>
          </div>
          <TraceComponent trace={selectedTrace} />
        </>
      )}
    </div>
  );
}
