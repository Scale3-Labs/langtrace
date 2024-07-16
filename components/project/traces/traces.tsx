"use client";

import { TraceRow } from "@/components/project/traces/trace-row";
import { Info } from "@/components/shared/info";
import { Button } from "@/components/ui/button";
import { HOW_TO_GROUP_RELATED_OPERATIONS, PAGE_SIZE } from "@/lib/constants";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import FilterListIcon from "@mui/icons-material/FilterList";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { SetupInstructions } from "../../shared/setup-instructions";
import { Spinner } from "../../shared/spinner";
import { Checkbox } from "../../ui/checkbox";
import { Separator } from "../../ui/separator";
import { Switch } from "../../ui/switch";
import TraceFilter from "./trace-filter";
import TraceRowSkeleton from "./trace-row-skeleton";

export default function Traces({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showLoader, setShowLoader] = useState(false);
  const [filters, setFilters] = useState<PropertyFilter[]>([]);
  const [enableFetch, setEnableFetch] = useState(false);
  const [utcTime, setUtcTime] = useState(true);
  const [isTraceFilterOpen, setIsTraceFilterOpen] = useState(false);
  const [groupSpans, setGroupSpans] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [promptId, setPromptId] = useState<string>("");
  const [model, setModel] = useState<string>("");

  useEffect(() => {
    setShowLoader(true);
    setCurrentData([]);
    setPage(1);
    setTotalPages(1);
    setEnableFetch(true);

    // fetch preferences from local storage
    if (typeof window !== "undefined") {
      const utc = window.localStorage.getItem("preferences.timestamp.utc");
      setUtcTime(utc === "true");

      const group = window.localStorage.getItem("preferences.group");
      setGroupSpans(group === "true");
    }
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

  const fetchTraces = useQuery({
    queryKey: ["fetch-traces-query"],
    queryFn: async () => {
      const apiEndpoint = "/api/traces";

      const body = {
        page,
        pageSize: PAGE_SIZE,
        projectId: project_id,
        filters: {
          filters: filters,
          operation: "OR",
        },
        group: groupSpans,
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
    onError: (error) => {
      setEnableFetch(false);
      setShowLoader(false);
      toast.error("Failed to fetch traces", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    refetchOnWindowFocus: false,
    enabled: enableFetch,
  });

  const FILTERS: { key: string; value: string; info: string }[] = [
    {
      key: "llm",
      value: "LLM Requests",
      info: "Requests made to a LLM. This includes requests like text embedding, text generation, text completion, etc.",
    },
    {
      key: "vectordb",
      value: "VectorDB Requests",
      info: "Requests made to a VectorDB. This includes requests like vector search, vector similarity, etc.",
    },
    {
      key: "framework",
      value: "Framework Requests",
      info: "This includes traces from Framework calls like langchain, CrewAI, DSPy etc.",
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
                        type: "attribute",
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
              <Info information={item.info} />
            </div>
          ))}
          <div className="flex items-center gap-1">
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => setIsTraceFilterOpen(true)}
            >
              <FilterListIcon className="cursor-pointer" />
            </Button>
            <p className="text-xs font-semibold">Advanced Filters</p>
          </div>
          {filters.length > 0 && (
            <Button
              size={"sm"}
              variant={"destructive"}
              onClick={() => {
                setFilters([]);
                setUserId("");
                setPromptId("");
                setModel("");
              }}
            >
              <XIcon className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
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
                  toast.success("Timezone preference saved successfully.");
                }
              }}
            />
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold">UTC</p>
              <Info information="By default all the spans are recorded in UTC timezone for the sake of standardization. By toggling this setting, you can visualize the spans in your local timezone." />
            </div>
          </div>
          <div className="flex gap-2 items-center w-full">
            <p className="text-xs font-semibold">Don&apos;t Group</p>
            <Switch
              className="text-start"
              id="group"
              checked={groupSpans}
              onCheckedChange={(check) => {
                setGroupSpans(check);

                // Save the preference in local storage
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(
                    "preferences.group",
                    check ? "true" : "false"
                  );
                  toast.success("Group spans preference saved successfully.");
                }
              }}
            />
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold">Group Spans by Trace ID</p>
              <Info information="This will group spans with the same parent trace id together. Grouping spans will help organize related operations together. To learn more about how you can group spans, refer to our documentation on this." />
              <Link
                href={HOW_TO_GROUP_RELATED_OPERATIONS}
                target="_blank"
                className="text-xs hover:underline text-blue-600"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-13 items-center gap-6 p-3 bg-muted">
        <p className="ml-10 text-xs font-medium">
          Time <span>&#8595;</span> ({utcTime ? "UTC" : "Local"})
        </p>
        <p className="text-xs font-medium">Namespace</p>
        <p className="text-xs font-medium">Model</p>
        <p className="text-xs font-medium col-span-2">Input</p>
        <p className="text-xs font-medium col-span-2">Output</p>
        <p className="text-xs font-medium">User ID</p>
        <p className="text-xs font-medium">Prompt ID</p>
        <p className="text-xs font-medium">Prompt Version</p>
        <p className="text-xs font-medium">Input / Output / Total Tokens</p>
        <p className="text-xs font-medium">Token Cost</p>
        <p className="text-xs font-medium">Duration(ms)</p>
      </div>
      {fetchTraces.isLoading || !fetchTraces?.data || !currentData ? (
        <PageSkeleton />
      ) : (
        <div
          className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll"
          ref={scrollableDivRef as any}
        >
          {!fetchTraces.isLoading &&
            fetchTraces?.data &&
            currentData?.map((trace: any, i: number) => {
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
            fetchTraces?.data &&
            currentData?.length === 0 &&
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
      <TraceFilter
        open={isTraceFilterOpen}
        onClose={() => setIsTraceFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        userId={userId}
        setUserId={setUserId}
        promptId={promptId}
        setPromptId={setPromptId}
        model={model}
        setModel={setModel}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      {Array.from({ length: 3 }).map((_, index) => (
        <TraceRowSkeleton key={index} />
      ))}
    </div>
  );
}
