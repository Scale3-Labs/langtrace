"use client";

import { DatasetDropdown } from "@/components/shared/dataset-dropdown";
import RowSkeleton from "@/components/shared/row-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVALUATIONS_DOCS_URL } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import { Run } from "@prisma/client";
import { ArrowTopRightIcon, ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ClipboardIcon, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Evaluations() {
  const searchParams = useSearchParams();
  const urldatasetId = searchParams?.get("dataset_id") || "";
  const router = useRouter();
  const projectId = useParams()?.project_id as string;
  const [comparisonRunIds, setComparisonRunIds] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showLoader, setShowLoader] = useState(false);
  const [tableState, setTableState] = useState<any>({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openDropdown, setOpenDropdown] = useState(false);
  const [datasetId, setDatasetId] = useState<string>(urldatasetId);
  const [manualRefetching, setManualRefetching] = useState(true);

  useEffect(() => {
    setCurrentData([]);
    setPage(1);
    setTotalPages(1);
    setManualRefetching(true);
  }, [datasetId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedState = window.localStorage.getItem(
          "preferences.evals.table-view"
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

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchExperiments.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchExperiments.refetch();
    }
  });

  const fetchExperiments = useQuery({
    queryKey: ["fetch-experiments-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/run?projectId=${projectId}&datasetId=${datasetId}&page=${page}&pageSize=25`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch evaluations");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      const newData = data.runs || [];
      const metadata = data?.metadata || {};

      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }
      // Merge the new data with the existing data
      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];
        // Remove duplicates
        const uniqueData = updatedData.filter(
          (v: any, i: number, a: any) =>
            a.findIndex((t: any) => t.id === v.id) === i
        );
        setCurrentData(uniqueData);
      } else {
        setCurrentData(newData);
      }
      setShowLoader(false);
      setManualRefetching(false);
    },
    onError: (error) => {
      setShowLoader(false);
      setManualRefetching(false);
      toast.error("Failed to fetch evaluations", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
    enabled: manualRefetching,
    refetchOnWindowFocus: false,
  });

  const columns: ColumnDef<Run>[] = [
    {
      size: 50,
      accessorKey: "check_box",
      enableResizing: false,
      header: "Select",
      cell: ({ row }) => {
        const logString = row.getValue("log") as string;
        const log = JSON.parse(logString);
        return (
          <Checkbox
            id={row.getValue("runId") as string}
            onClick={(e) => e.stopPropagation()}
            disabled={log?.status !== "success"}
            checked={comparisonRunIds.includes(row.getValue("runId") as string)}
            onCheckedChange={(checked) => {
              if (checked) {
                setComparisonRunIds((prev) => [
                  ...prev,
                  row.getValue("runId") as string,
                ]);
              } else {
                setComparisonRunIds((prev) =>
                  prev.filter((id) => id !== row.getValue("runId"))
                );
              }
            }}
          />
        );
      },
    },
    {
      accessorKey: "runId",
      enableResizing: true,
      header: "Run ID",
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground text-xs">
            {row.getValue("runId") as string}
          </div>
        );
      },
    },
    {
      accessorKey: "datasetId",
      enableResizing: true,
      header: "Dataset ID",
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground text-xs font-semibold">
            {row.getValue("datasetId") as string}
          </div>
        );
      },
    },
    {
      accessorKey: "startedAt",
      size: 200,
      enableResizing: true,
      header: "Started At",
      cell: ({ row }) => {
        const logString = row.getValue("log") as string;
        const log = JSON.parse(logString);
        return (
          <div className="text-muted-foreground text-sm">
            {formatDateTime(log?.stats?.started_at, true)}
          </div>
        );
      },
    },
    {
      accessorKey: "completedAt",
      size: 200,
      enableResizing: true,
      header: "Completed At",
      cell: ({ row }) => {
        const logString = row.getValue("log") as string;
        const log = JSON.parse(logString);
        return (
          <div className="text-muted-foreground text-sm">
            {formatDateTime(log?.stats?.completed_at, true)}
          </div>
        );
      },
    },
    {
      accessorKey: "totalSamples",
      enableResizing: true,
      header: "Total Samples",
      cell: ({ row }) => {
        const logString = row.getValue("log") as string;
        const log = JSON.parse(logString);
        return (
          <div className="text-muted-foreground text-sm font-semibold">
            {log?.samples?.length || 0}
          </div>
        );
      },
    },
    {
      accessorKey: "model",
      enableResizing: true,
      size: 400,
      header: "Model",
      cell: ({ row }) => {
        const logString = row.getValue("log") as string;
        const log = JSON.parse(logString);
        return (
          <div className="text-muted-foreground text-sm font-semibold">
            {log?.eval?.model}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      enableResizing: true,
      header: "Status",
      cell: ({ row }) => {
        const logString = row.getValue("log") as string;
        const log = JSON.parse(logString);
        return (
          <Badge
            className={cn(
              log?.status === "success" ? "bg-green-500" : "bg-destructive",
              "text-white"
            )}
          >
            {log?.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "log",
      enableResizing: true,
      header: "Raw Logs",
      cell: ({ row }) => {
        const logString = row.getValue("log") as string;
        const log = JSON.parse(logString);
        return (
          <Button
            size={"icon"}
            variant={"outline"}
            className="cursor-pointer"
            onClick={() => {
              toast.success("Log copied to clipboard");
              navigator.clipboard.writeText(JSON.stringify(log, null, 2));
            }}
          >
            <ClipboardIcon size={20} />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: currentData,
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
        "preferences.evals.table-view",
        JSON.stringify(currState)
      );
    },
    onColumnVisibilityChange: (newVisibility) => {
      setColumnVisibility(newVisibility);
      const currState = table.getState();
      localStorage.setItem(
        "preferences.evals.table-view",
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
    <div className="w-full flex flex-col gap-4">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Evaluations</h1>
        <div className="flex gap-2">
          <Button
            variant={currentData.length > 0 ? "default" : "outline"}
            disabled={comparisonRunIds.length < 2}
            onClick={() => {
              // append comparisonRunIds to query params. & only from the second run id
              const query = comparisonRunIds
                .map((runId, i) => (i === 0 ? "" : "&") + "run_id=" + runId)
                .join("");
              router.push(`/project/${projectId}/evaluations/compare?${query}`);
            }}
          >
            Compare
          </Button>
          <Link href={EVALUATIONS_DOCS_URL} target="_blank">
            <Button variant={currentData.length > 0 ? "outline" : "default"}>
              New Evaluation
              <FlaskConical className="ml-1 h-4 w-4" />
              <ArrowTopRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      {!fetchExperiments.isLoading && (
        <div className="flex flex-col gap-12 w-full px-12">
          <div className="flex items-center justify-between">
            <DatasetDropdown
              projectId={projectId}
              setDatasetId={setDatasetId}
              datasetId={datasetId}
            />
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
                  localStorage.removeItem("preferences.evals.table-view");
                }}
              >
                <ResetIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {currentData.length === 0 && !manualRefetching && (
            <div className="flex flex-col items-center gap-2 mt-24">
              <p className="text-center text-md">
                {fetchExperiments.isError
                  ? "Something went wrong. Please try later."
                  : "No evaluations found. Get started by running your first evaluation."}
              </p>
              <Link href={EVALUATIONS_DOCS_URL} target="_blank">
                <Button>
                  New Evaluation
                  <FlaskConical className="ml-1 h-4 w-4" />
                  <ArrowTopRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
          {currentData.length > 0 && !manualRefetching && (
            <div
              className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll mb-12"
              ref={scrollableDivRef as any}
            >
              <Table style={{ ...columnSizeVars, width: table.getTotalSize() }}>
                <TableHeader className="sticky top-0 bg-secondary z-50">
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
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      onClick={() =>
                        router.push(
                          `/project/${projectId}/evaluations/${row.original.runId}`
                        )
                      }
                      className="cursor-pointer"
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
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
              {showLoader && (
                <div className="flex flex-col gap-3">
                  <Separator />
                  {Array.from({ length: 2 }).map((_, index) => (
                    <RowSkeleton key={index} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {(fetchExperiments.isLoading || manualRefetching) && (
        <div className="px-12 mt-8">
          <div className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll mb-12">
            <div className="flex flex-col gap-3">
              <Separator />
              {Array.from({ length: 10 }).map((_, index) => (
                <RowSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
