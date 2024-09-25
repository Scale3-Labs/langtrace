"use client";
import {
  DspyEvalChart,
  DspyEvalChartData,
} from "@/components/charts/dspy-eval-chart";
import {
  AverageCostInferenceChart,
  CountInferenceChart,
} from "@/components/charts/inference-chart";
import { TableSkeleton } from "@/components/project/traces/table-skeleton";
import { TraceSheet } from "@/components/project/traces/trace-sheet";
import { GenericHoverCell } from "@/components/shared/hover-cell";
import RowSkeleton from "@/components/shared/row-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAGE_SIZE } from "@/lib/constants";
import { DspyTrace, processDspyTrace } from "@/lib/dspy_trace_util";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { formatDateTime } from "@/lib/utils";
import { ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, RefreshCwIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";

export function PageClient({ email }: { email: string }) {
  const pathname = usePathname();
  const project_id = pathname.split("/")[2];
  let experimentName = pathname.split("/")[4];
  // replace dashes with spaces
  experimentName = experimentName.replace(/-/g, " ");

  const [data, setData] = useState<DspyTrace[]>([]);
  const [page, setPage] = useState(1);
  const [description, setDescription] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<DspyTrace | null>(null);
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  const [enableFetch, setEnableFetch] = useState(true);
  const [chartData, setChartData] = useState<DspyEvalChartData[]>([]);
  const [showEvalChart, setShowEvalChart] = useState(false);

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

  // Table state
  const [tableState, setTableState] = useState<any>({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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
              key: "experiment",
              operation: "EQUALS",
              value: experimentName,
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedState = window.localStorage.getItem(
          "preferences.traces.table-view"
        );
        if (storedState) {
          const parsedState = JSON.parse(storedState);
          setTableState((prevState: any) => ({
            ...prevState,
            ...parsedState,
            pagination: {
              ...prevState.pagination,
              ...parsedState.pagination,
            },
          }));
          if (parsedState.columnVisibility) {
            setColumnVisibility(parsedState.columnVisibility);
          }
        }
      } catch (error) {
        console.error("Error parsing stored table state:", error);
      }
    }
  }, []);

  const fetchTraces = useQuery({
    queryKey: ["fetch-experiments-query", page, experimentName],
    queryFn: () => fetchTracesCall(page),
    onSuccess: (data) => {
      const newData = data?.traces?.result || [];
      const metadata = data?.traces?.metadata || {};
      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      const transformedNewData: DspyTrace[] = newData.map((trace: any) => {
        return processDspyTrace(trace);
      });

      setDescription(
        transformedNewData.length > 0
          ? transformedNewData[0].experiment_description
          : ""
      );

      if (page === 1) {
        setData(transformedNewData);
      } else {
        setData((prevData) => [...prevData, ...transformedNewData]);
      }

      // construct chart data
      const chartData: DspyEvalChartData[] = [];
      for (const trace of transformedNewData) {
        if (trace.evaluated_score) {
          chartData.push({
            timestamp: formatDateTime(
              correctTimestampFormat(trace.start_time.toString()),
              true
            ),
            score: trace.evaluated_score,
            runId: trace.run_id,
          });
        }
      }
      // reverse the chart data to show the latest last
      chartData.reverse();
      if (page === 1) {
        setChartData(chartData);
      } else {
        setChartData((prevData) => [...chartData, ...prevData]);
      }

      setEnableFetch(false);
      setShowBottomLoader(false);
    },
    onError: (error) => {
      setEnableFetch(false);
      setShowBottomLoader(false);
      toast.error("Failed to fetch traces", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    refetchOnWindowFocus: false,
    enabled: enableFetch,
  });

  const scrollableDivRef: any = useBottomScrollListener(() => {
    if (fetchTraces.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowBottomLoader(true);
      fetchTraces.refetch();
    }
  });

  const columns: ColumnDef<DspyTrace>[] = [
    {
      accessorKey: "run_id",
      enableResizing: true,
      header: "Run ID",
      cell: ({ row }) => {
        const id = row.getValue("run_id") as string;
        return (
          <div className="text-left text-muted-foreground text-xs font-semibold">
            {id}
          </div>
        );
      },
    },
    {
      accessorKey: "start_time",
      enableResizing: true,
      header: "Start Time",
      cell: ({ row }) => {
        const starttime = row.getValue("start_time") as string;
        return (
          <div className="text-left text-muted-foreground text-xs font-semibold">
            {formatDateTime(correctTimestampFormat(starttime), true)}
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
      accessorKey: "result",
      header: "Result",
      cell: ({ row }) => {
        const result = row.getValue("result") as any;
        return <GenericHoverCell value={result} />;
      },
    },
    {
      accessorKey: "checkpoint",
      header: "Checkpoint State",
      cell: ({ row }) => {
        const result = row.getValue("checkpoint") as any;
        return <GenericHoverCell value={result} />;
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      ...tableState,
      pagination: tableState.pagination,
      columnVisibility,
    },
    state: {
      ...tableState,
      pagination: tableState.pagination,
      columnVisibility,
    },
    onStateChange: (newState: any) => {
      setTableState((prevState: any) => ({
        ...newState,
        pagination: newState.pagination || prevState.pagination,
      }));
      const currState = table.getState();
      localStorage.setItem(
        "preferences.traces.table-view",
        JSON.stringify(currState)
      );
    },
    onColumnVisibilityChange: (newVisibility) => {
      setColumnVisibility(newVisibility);
      const currState = table.getState();
      localStorage.setItem(
        "preferences.traces.table-view",
        JSON.stringify(currState)
      );
    },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    manualPagination: true, // Add this if you're handling pagination yourself
  });

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  return (
    <div className="flex flex-col gap-4 w-full p-2">
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            size={"icon"}
            onClick={() => {
              setPage(1);
              setEnableFetch(true);
              fetchTraces.refetch();
            }}
          >
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold capitalize">
              {experimentName}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground max-w-[500px] truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="h-72 overflow-y-visible">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onSelect={() => setOpenDropdown(true)}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.columnDef.header?.toString()}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size={"icon"}
            variant={"destructive"}
            onClick={() => {
              setColumnVisibility({});
              setTableState({});
              localStorage.removeItem("preferences.traces.table-view");
            }}
          >
            <ResetIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <Tabs defaultValue="eval" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="eval">Eval Chart</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
        </TabsList>
        <TabsContent value="eval">
          {chartData.length > 0 && (
            <DspyEvalChart
              data={chartData}
              isLoading={fetchTraces.isLoading || fetchTraces.isFetching}
            />
          )}
        </TabsContent>
        <TabsContent value="cost">
          <div className="flex flex-row flex-wrap items-center gap-3">
            <AverageCostInferenceChart
              projectId={project_id}
              experimentId={experimentName}
            />
            <CountInferenceChart
              projectId={project_id}
              experimentId={experimentName}
            />
          </div>
        </TabsContent>
      </Tabs>
      <div
        className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll"
        ref={scrollableDivRef as any}
      >
        {fetchTraces.isLoading && <TableSkeleton />}
        {!fetchTraces.isLoading && data && data.length > 0 && (
          <Table style={{ ...columnSizeVars, width: table.getTotalSize() }}>
            <TableHeader className="sticky top-0 z-50 bg-secondary">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{
                        width: `calc(var(--header-${header.id}-size) * 1px)`,
                        position: "relative",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      <div
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`bg-muted-foreground resizer ${
                          header.column.getIsResizing() ? "isResizing" : ""
                        }`}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {fetchTraces.isFetching && (
                <TableRow className="cursor-pointer">
                  {table.getFlatHeaders().map((header) => (
                    <TableCell
                      key={header.id}
                      style={{
                        width: `calc(var(--col-${header.column.id}-size) * 1px)`,
                      }}
                    >
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              )}
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  className="cursor-pointer"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    setSelectedTrace(data[row.index] as DspyTrace);
                    setOpenSheet(true);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {selectedTrace !== null && (
          <TraceSheet
            project_id={project_id}
            trace={selectedTrace}
            open={openSheet}
            setOpen={setOpenSheet}
          />
        )}
        {showBottomLoader && (
          <div className="flex flex-col gap-3">
            <Separator />
            {Array.from({ length: 2 }).map((_, index) => (
              <RowSkeleton key={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
