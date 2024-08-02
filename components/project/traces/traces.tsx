"use client";

import { HoverCell } from "@/components/shared/hover-cell";
import { Info } from "@/components/shared/info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/constants";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { processTrace, Trace } from "@/lib/trace_util";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { formatDateTime } from "@/lib/utils";
import FilterListIcon from "@mui/icons-material/FilterList";
import { ColumnDef } from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { Checkbox } from "../../ui/checkbox";
import { Switch } from "../../ui/switch";
import TraceFilter from "./trace-filter";
import { TracesTable } from "./traces-table";

export default function Traces({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  const [showFreshLoading, setShowFreshLoading] = useState(false);
  const [filters, setFilters] = useState<PropertyFilter[]>([]);
  const [enableFetch, setEnableFetch] = useState(false);
  const [utcTime, setUtcTime] = useState(false);
  const [isTraceFilterOpen, setIsTraceFilterOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [promptId, setPromptId] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [expandedView, setExpandedView] = useState(false);
  const [group, setGroup] = useState(true);

  useEffect(() => {
    setCurrentData([]);
    setPage(1);
    setTotalPages(1);
    setShowFreshLoading(true);
    setEnableFetch(true);

    // fetch preferences from local storage
    if (typeof window !== "undefined") {
      const utc = window.localStorage.getItem("preferences.timestamp.utc");
      setUtcTime(utc === "true");

      const expanded = window.localStorage.getItem("preferences.expanded");
      setExpandedView(expanded === "true");

      const group = window.localStorage.getItem("preferences.group");
      setGroup(group === "true");
    }
  }, [filters]);

  useEffect(() => {
    const handleFocusChange = () => {
      setPage(1);
      setEnableFetch(true);
    };

    window.addEventListener("focus", handleFocusChange);

    return () => {
      window.removeEventListener("focus", handleFocusChange);
    };
  }, []);

  const columns: ColumnDef<Trace>[] = [
    {
      accessorKey: "start_time",
      enableResizing: true,
      header: "Start Time",
      cell: ({ row }) => {
        const starttime = row.getValue("start_time") as string;
        return (
          <div className="text-left text-muted-foreground text-xs font-semibold">
            {formatDateTime(correctTimestampFormat(starttime), !utcTime)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="text-left flex gap-2 items-center">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "error" ? "bg-red-500" : "bg-teal-400"
              }`}
            ></span>
            <p className="text-muted-foreground text-xs font-semibold capitalize">
              {status}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "namespace",
      header: "Namespace",
      cell: ({ row }) => {
        const namespace = row.getValue("namespace") as string;
        return (
          <div className="text-left">
            <p className="text-xs font-semibold">{namespace}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "user_ids",
      header: "User IDs",
      cell: ({ row }) => {
        const userids = row.getValue("user_ids") as string[];
        // Remove duplicates
        const uniqueUserids = Array.from(
          new Set(
            userids
              .map((userid) => userid.toLowerCase())
              .filter((userid) => userid !== "")
          )
        );
        return (
          <div className="flex gap-1 flex-wrap">
            {uniqueUserids.map((userid, i) => (
              <Badge key={i} variant="secondary" className="lowercase">
                {userid}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "prompt_ids",
      header: "Prompt IDs",
      cell: ({ row }) => {
        const promptids = row.getValue("prompt_ids") as string[];
        // Remove duplicates
        const uniquePromptids = Array.from(
          new Set(
            promptids
              .map((promptid) => promptid.toLowerCase())
              .filter((promptid) => promptid !== "")
          )
        );
        return (
          <div className="flex gap-1 flex-wrap">
            {uniquePromptids.map((promptid, i) => (
              <Badge key={i} variant="secondary" className="lowercase">
                {promptid}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "vendors",
      header: "Vendors",
      cell: ({ row }) => {
        const vendors = row.getValue("vendors") as string[];
        return (
          <div className="flex flex-col gap-3 flex-wrap">
            {vendors &&
              vendors.map((vendor, i) => (
                <Badge key={i} variant="secondary" className="lowercase">
                  {vendor}
                </Badge>
              ))}
          </div>
        );
      },
    },
    {
      accessorKey: "models",
      header: "Models",
      cell: ({ row }) => {
        const models = row.getValue("models") as string[];
        return (
          <div className="flex flex-col gap-3">
            {models &&
              models.map((model, i) => (
                <Badge key={i} variant="secondary" className="lowercase">
                  {model}
                </Badge>
              ))}
          </div>
        );
      },
    },
    {
      size: 500,
      minSize: 20,
      accessorKey: "inputs",
      header: "Inputs",
      cell: ({ row }) => {
        const messages = row.getValue("inputs") as Record<string, string[]>[];
        if (!messages || messages.length === 0) {
          return null;
        }
        return (
          <div className="flex flex-col gap-3 flex-wrap">
            {messages.map((message, i) =>
              message.prompts && message.prompts.length > 0
                ? message.prompts.map((prompt, j) => (
                    <HoverCell
                      key={j}
                      values={JSON.parse(prompt)}
                      expand={expandedView}
                    />
                  ))
                : null
            )}
          </div>
        );
      },
    },
    {
      size: 500,
      minSize: 20,
      accessorKey: "outputs",
      header: "Outputs",
      cell: ({ row }) => {
        const messages = row.getValue("outputs") as Record<string, string[]>[];
        if (!messages || messages.length === 0) {
          return null;
        }
        return (
          <div className="flex flex-col gap-3 flex-wrap">
            {messages.map((message, i) =>
              message.responses && message.responses.length > 0
                ? message.responses.map((response, j) => (
                    <HoverCell
                      key={j}
                      values={JSON.parse(response)}
                      expand={expandedView}
                    />
                  ))
                : null
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "input_tokens",
      header: "Input Tokens",
      cell: ({ row }) => {
        const count = row.getValue("input_tokens") as number;
        return <p className="text-xs font-semibold">{count}</p>;
      },
    },
    {
      accessorKey: "output_tokens",
      header: "Output Tokens",
      cell: ({ row }) => {
        const count = row.getValue("output_tokens") as number;
        return <p className="text-xs font-semibold">{count}</p>;
      },
    },
    {
      accessorKey: "total_tokens",
      header: "Total Tokens",
      cell: ({ row }) => {
        const count = row.getValue("total_tokens") as number;
        return <p className="text-xs font-semibold">{count}</p>;
      },
    },
    {
      accessorKey: "input_cost",
      header: "Input Cost",
      cell: ({ row }) => {
        const cost = row.getValue("input_cost") as number;
        if (!cost) {
          return null;
        }
        return (
          <p className="text-xs font-semibold">
            {cost.toFixed(6) !== "0.000000" ? `\$${cost.toFixed(6)}` : ""}
          </p>
        );
      },
    },
    {
      accessorKey: "output_cost",
      header: "Output Cost",
      cell: ({ row }) => {
        const cost = row.getValue("output_cost") as number;
        if (!cost) {
          return null;
        }
        return (
          <p className="text-xs font-semibold">
            {cost.toFixed(6) !== "0.000000" ? `\$${cost.toFixed(6)}` : ""}
          </p>
        );
      },
    },
    {
      accessorKey: "total_cost",
      header: "Total Cost",
      cell: ({ row }) => {
        const cost = row.getValue("total_cost") as number;
        if (!cost) {
          return null;
        }
        return (
          <p className="text-xs font-semibold">
            {cost.toFixed(6) !== "0.000000" ? `\$${cost.toFixed(6)}` : ""}
          </p>
        );
      },
    },
    {
      accessorKey: "total_duration",
      header: "Total Duration",
      cell: ({ row }) => {
        const duration = row.getValue("total_duration") as number;
        if (!duration) {
          return null;
        }
        return <p className="text-xs font-semibold">{duration}ms</p>;
      },
    },
  ];

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowBottomLoader(true);
      fetchTraces.refetch();
    }
  });

  const fetchTracesCall = useCallback(
    async (pageNum: number) => {
      const apiEndpoint = "/api/traces";

      const body = {
        page: pageNum,
        pageSize: PAGE_SIZE,
        projectId: project_id,
        filters: {
          filters: filters,
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
    [project_id, filters]
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

      let transformedNewData = [];
      if (group) {
        transformedNewData = newData.map((trace: any) => {
          return processTrace(trace);
        });
      } else {
        for (const i in newData) {
          for (const j in newData[i]) {
            const processedSpan = processTrace([newData[i][j]]);
            transformedNewData.push(processedSpan);
          }
        }
      }

      if (page === 1) {
        setCurrentData(transformedNewData);
      } else {
        setCurrentData((prevData: any) => [...prevData, ...transformedNewData]);
      }

      setEnableFetch(false);
      setShowFreshLoading(false);
      setShowBottomLoader(false);
    },
    onError: (error) => {
      setEnableFetch(false);
      setShowFreshLoading(false);
      setShowBottomLoader(false);
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
                disabled={showBottomLoader}
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
                  toast.success("Preferences updated.");
                }
              }}
            />
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold">UTC</p>
              <Info information="By default all the spans are recorded in UTC timezone for the sake of standardization. By toggling this setting, you can visualize the spans in your local timezone." />
            </div>
          </div>
          <div className="flex gap-2 items-center w-full">
            <p className="text-xs font-semibold">Compress</p>
            <Switch
              className="text-start"
              id="expanded"
              checked={expandedView}
              onCheckedChange={(check) => {
                setExpandedView(check);

                // Save the preference in local storage
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(
                    "preferences.expanded",
                    check ? "true" : "false"
                  );
                  toast.success("Preferences updated.");
                }
              }}
            />
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold">Expand</p>
              <Info information="By default, the input and output messages are compressed to fit the table. By toggling this setting, you can expand the input and output messages to view the complete content." />
            </div>
          </div>
          <div className="flex gap-2 items-center w-full">
            <p className="text-xs font-semibold">Don&apos;t group</p>
            <Switch
              className="text-start"
              id="group"
              checked={group}
              onCheckedChange={(check) => {
                setGroup(check);
                setPage(1);
                setEnableFetch(true);

                // Save the preference in local storage
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(
                    "preferences.group",
                    check ? "true" : "false"
                  );
                  toast.success("Preferences updated.");
                }
              }}
            />
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold">Group</p>
              <Info information="By default, the spans are grouped if they are part of a single trace with a common parent. By toggling this setting, you can view spans individually without any relationships." />
            </div>
          </div>
        </div>
      </div>
      <TracesTable
        project_id={project_id}
        columns={columns}
        data={currentData}
        loading={
          (fetchTraces.isLoading || showFreshLoading) && !showBottomLoader
        }
        refetch={() => {
          setPage(1);
          setEnableFetch(true);
        }}
        fetching={fetchTraces.isFetching}
        paginationLoading={showBottomLoader}
        scrollableDivRef={scrollableDivRef}
      />
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
