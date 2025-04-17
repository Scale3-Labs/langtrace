"use client";

import { HoverCell } from "@/components/shared/hover-cell";
import { PaginationDropdown } from "@/components/shared/pagination-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { processTrace, Trace } from "@/lib/trace_util";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { cn, formatDateTime } from "@/lib/utils";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { RefreshCwIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { FilterSheet } from "./filter-sheet";
import { TracesDownload } from "./traces-download";
import { TracesTable } from "./traces-table";

interface TracesProps {
  project_id: string;
}

export default function Traces({ project_id }: TracesProps) {
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  const [showFreshLoading, setShowFreshLoading] = useState(false);
  const [filters, setFilters] = useState<PropertyFilter[]>([]);
  const [enableFetch, setEnableFetch] = useState(false);
  const [utcTime, setUtcTime] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [promptId, setPromptId] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [expandedView, setExpandedView] = useState(false);
  const [group, setGroup] = useState(true);
  const [keyword, setKeyword] = useState<string>("");
  const [pageSize, setPageSize] = useState<string>("10");

  useEffect(() => {
    setCurrentData([]);
    setPage(1);
    setTotalPages(1);
    setShowFreshLoading(true);
    setEnableFetch(true);

    if (typeof window !== "undefined") {
      const utc = window.localStorage.getItem("preferences.timestamp.utc");
      setUtcTime(utc === "true");

      const expanded = window.localStorage.getItem("preferences.expanded");
      setExpandedView(expanded === "true");

      const group = window.localStorage.getItem("preferences.group");
      // Default group to true if not set
      setGroup(group === "false" ? false : true);

      const storedPageSize = localStorage.getItem(
        "preferences.traces.page-size"
      );
      if (storedPageSize) {
        setPageSize(storedPageSize);
      }
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
      accessorKey: "session_id",
      header: "Session ID",
      cell: ({ row }) => {
        const session_id = row.getValue("session_id") as string;
        return (
          <div className="text-left">
            <p className="text-xs font-semibold">{session_id}</p>
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
        // deduplicate models
        const uniqueModels = Array.from(
          new Set(
            models
              .map((model) => model.toLowerCase())
              .filter((model) => model !== "")
          )
        );
        const length = uniqueModels.length;
        const firstModel = uniqueModels.find((model) => model !== "");
        return (
          <div className="flex flex-col gap-3">
            {firstModel && (
              <Badge variant="secondary" className="lowercase">
                {firstModel}
              </Badge>
            )}
            {length > 1 && (
              <p className="text-xs font-semibold mt-2">{length - 1} more...</p>
            )}
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
        const length = messages.length;
        // get the first message with a prompt
        const firstMessage = messages.find(
          (message) => message.prompts && message.prompts.length > 0
        );
        return (
          <div className="flex flex-col gap-3 flex-wrap">
            {firstMessage
              ? firstMessage.prompts.map((prompt, j) => (
                  <HoverCell
                    key={j}
                    values={JSON.parse(prompt)}
                    expand={expandedView}
                  />
                ))
              : null}
            {length - (firstMessage?.prompts?.length || 0) > 0 && (
              <p className="text-xs font-semibold mt-2">
                {length - (firstMessage?.prompts?.length || 0)} more...
              </p>
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
        // get the first message with a response
        const firstMessage = messages.find(
          (message) => message.responses && message.responses.length > 0
        );
        return (
          <div className="flex flex-col gap-3 flex-wrap">
            {firstMessage
              ? firstMessage.responses.map((response, j) => (
                  <HoverCell
                    key={j}
                    values={JSON.parse(response)}
                    expand={expandedView}
                  />
                ))
              : null}
            {length - (firstMessage?.responses?.length || 0) > 0 && (
              <p className="text-xs font-semibold mt-2">
                {length - (firstMessage?.responses?.length || 0)} more...
              </p>
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
      accessorKey: "cached_input_tokens",
      header: "Cached Input Tokens",
      cell: ({ row }) => {
        const count = row.getValue("cached_input_tokens") as number;
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
      accessorKey: "cached_input_cost",
      header: "Cached Input Cost",
      cell: ({ row }) => {
        const cost = row.getValue("cached_input_cost") as number;
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
      accessorKey: "cleanlab_tlm_score",
      header: "Cleanlab TLM Score",
      cell: ({ row }) => {
        const score = row.getValue("cleanlab_tlm_score") as number;
        return <p className="text-xs font-semibold">{score}</p>;
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

      const body: any = {
        page: pageNum,
        pageSize: parseInt(pageSize),
        projectId: project_id,
        filters: {
          filters: filters,
          operation: "OR",
        },
        group: true,
      };

      if (keyword !== "") {
        body.keyword = keyword;
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="w-full py-6 px-6 flex flex-col gap-4">
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-2 items-center w-full">
          <Button
            variant="outline"
            size={"icon"}
            onClick={() => fetchTraces.refetch()}
          >
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
          <FilterSheet
            utcTime={utcTime}
            setUtcTime={setUtcTime}
            expandedView={expandedView}
            setExpandedView={setExpandedView}
            group={group}
            setGroup={setGroup}
            setPage={setPage}
            setEnableFetch={setEnableFetch}
            filters={filters}
            setFilters={setFilters}
            showBottomLoader={showBottomLoader}
            userId={userId}
            setUserId={setUserId}
            promptId={promptId}
            setPromptId={setPromptId}
            model={model}
            setModel={setModel}
          />
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
          <div className="relative">
            <MagnifyingGlassIcon className="absolute top-2 left-2 text-muted-foreground h-5 w-5" />
            <Input
              className="w-[700px] border-muted rounded-md pl-8"
              placeholder="Search for anything in your traces (Hit Enter to search)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setFilters([]);
                  setEnableFetch(true);
                }
              }}
            />
          </div>
          <TracesDownload project_id={project_id} />
          <PaginationDropdown
            value={pageSize}
            setValue={(value) => {
              setPageSize(value);
              localStorage.setItem("preferences.traces.page-size", value);
              if (value !== pageSize) {
                setFilters([...filters]);
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={"outline"} className="text-xs text-muted-foreground">
            Project ID: {project_id}
          </Badge>
          <Badge
            variant={"outline"}
            className={cn(
              "text-xs font-semibold",
              fetchTraces.isFetching
                ? "text-orange-500"
                : "text-muted-foreground"
            )}
          >
            {fetchTraces.isFetching
              ? "Fetching traces..."
              : `Fetched the latest ${currentData.length} traces`}
          </Badge>
        </div>
      </div>

      <TracesTable
        pageSize={parseInt(pageSize)}
        setPageSize={setPageSize}
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
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
