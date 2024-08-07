"use client";

import ModelEvalMetricsChart from "@/components/evaluations/model-eval-metrics-chart";
import ModelScorerMetricsChart from "@/components/evaluations/model-scorer-metrics-chart";
import { ExpandingTextArea } from "@/components/playground/common";
import { CreateData } from "@/components/project/dataset/create-data";
import DatasetRowSkeleton from "@/components/project/dataset/dataset-row-skeleton";
import { DeleteData } from "@/components/project/dataset/delete-data";
import { DownloadDataset } from "@/components/shared/download-dataset";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVALUATIONS_DOCS_URL, PAGE_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Data } from "@prisma/client";
import { ArrowTopRightIcon, ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  AreaChartIcon,
  ChevronDown,
  ChevronLeft,
  FlaskConical,
  MoveDiagonal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";

export default function Dataset() {
  const projectId = useParams()?.project_id as string;
  const dataset_id = useParams()?.dataset_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  const [currentData, setCurrentData] = useState<Data[]>([]);
  const [tableState, setTableState] = useState<any>({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openDropdown, setOpenDropdown] = useState(false);
  const [viewMetrics, setViewMetrics] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedState = window.localStorage.getItem(
          "preferences.dataset.table-view"
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

  const fetchEvalMetrics = useQuery({
    queryKey: ["fetchEvalMetrics", dataset_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/run/metrics?datasetId=${dataset_id}&projectId=${projectId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch dataset metrics");
      }
      const result = await response.json();
      return result;
    },
  });

  const fetchDataset = useQuery({
    queryKey: [dataset_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/dataset?dataset_id=${dataset_id}&page=${page}&pageSize=${PAGE_SIZE}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch dataset");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const newData: Data[] = data?.datasets?.Data || [];
      const metadata = data?.metadata || {};

      // Update the total pages and current page number
      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      // Merge the new data with the existing data
      if (currentData.length > 0) {
        const uniqueData = [
          ...currentData.filter(
            (item) => !newData.some((existing) => existing.id === item.id)
          ),
          ...newData,
        ];

        // sort new data by created_at and id if created_at is the same
        uniqueData.sort((a: Data, b: Data) => {
          const dateComparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateComparison !== 0) return dateComparison;
          return a.id.localeCompare(b.id);
        });

        setCurrentData(uniqueData);
      } else {
        // sort new data by created_at and id if created_at is the same
        newData.sort((a: Data, b: Data) => {
          const dateComparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateComparison !== 0) return dateComparison;
          return a.id.localeCompare(b.id);
        });
        setCurrentData(newData);
      }

      setShowBottomLoader(false);
    },
    onError: (error) => {
      setShowBottomLoader(false);
      toast.error("Failed to fetch dataset", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchDataset.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowBottomLoader(true);
      fetchDataset.refetch();
    }
  });

  const DataComponent = ({
    label,
    value,
    id,
    editable = false,
  }: {
    label: string;
    value: string;
    id?: string;
    editable?: boolean;
  }) => {
    const [busy, setBusy] = useState<boolean>(false);
    const [expandedView, setExpandedView] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [changedValue, setChangedValue] = useState(value);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    const queryClient = useQueryClient();
    return (
      <div className="flex flex-col gap-2">
        {!editMode && !expandedView && value && (
          <MoveDiagonal
            className="self-end h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedView(!expandedView);
            }}
          />
        )}
        {!editMode && expandedView && value && (
          <X
            className="self-end h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedView(!expandedView);
            }}
          />
        )}
        {editable && editMode && (
          <ExpandingTextArea
            onChange={(value: string) => {
              setChangedValue(value);
            }}
            busy={busy}
            value={changedValue}
            setFocusing={setEditMode}
            saveButtonRef={saveButtonRef}
            saveButtonLabel="Save"
            handleSave={async () => {
              try {
                setBusy(true);
                await fetch("/api/data", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: id,
                    [label]: changedValue,
                  }),
                });
                await queryClient.invalidateQueries({ queryKey: [dataset_id] });
                toast("Data saved!", {
                  description: "Your data has been saved.",
                });
              } catch (error: any) {
                toast("Error saving your dataset!", {
                  description: `There was an error saving your dataset: ${error.message}`,
                });
              } finally {
                setBusy(false);
                setEditMode(false);
              }
            }}
          />
        )}
        {(!editable || !editMode) && (
          <p
            onClick={() => editable && setEditMode(true)}
            className={cn(
              expandedView ? "" : "h-20",
              "text-sm overflow-y-scroll"
            )}
          >
            {value}
          </p>
        )}
      </div>
    );
  };

  const columns: ColumnDef<Data>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return (
          <p className="overflow-x-scroll text-xs text-muted-foreground">
            {row.getValue("id")}
          </p>
        );
      },
    },
    {
      size: 500,
      accessorKey: "input",
      enableResizing: true,
      header: "Input",
      cell: ({ row }) => {
        const input = row.getValue("input") as string;
        return <DataComponent value={input} label={"input"} />;
      },
    },
    {
      size: 500,
      accessorKey: "output",
      enableResizing: true,
      header: "Output",
      cell: ({ row }) => {
        const output = row.getValue("output") as string;
        return <DataComponent value={output} label={"output"} />;
      },
    },
    {
      size: 500,
      accessorKey: "expectedOutput",
      enableResizing: true,
      header: "Expected Output",
      cell: ({ row }) => {
        const expectedOutput = row.getValue("expectedOutput") as string;
        const id = row.getValue("id") as string;
        return (
          <DataComponent
            editable={true}
            value={expectedOutput}
            id={id}
            label={"expectedOutput"}
          />
        );
      },
    },
    {
      size: 100,
      accessorKey: "model",
      enableResizing: true,
      header: "Model",
      cell: ({ row }) => {
        const model = row.getValue("model") as string;
        return <p className="text-sm h-10 overflow-y-scroll">{model}</p>;
      },
    },
    {
      size: 300,
      accessorKey: "note",
      enableResizing: true,
      header: "Note",
      cell: ({ row }) => {
        const note = row.getValue("note") as string;
        const id = row.getValue("id") as string;
        return (
          <DataComponent editable={true} value={note} id={id} label={"note"} />
        );
      },
    },
    {
      size: 50,
      accessorKey: "delete",
      enableResizing: true,
      header: "Delete",
      cell: ({ row }) => {
        return <DeleteData id={row.getValue("id") as string} />;
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
        "preferences.dataset.table-view",
        JSON.stringify(currState)
      );
    },
    onColumnVisibilityChange: (newVisibility) => {
      setColumnVisibility(newVisibility);
      const currState = table.getState();
      localStorage.setItem(
        "preferences.dataset.table-view",
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

  if (fetchDataset.isLoading || !fetchDataset.data) {
    return <PageSkeleton />;
  } else {
    return (
      <div className="w-full py-6 px-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center w-fit">
            <Button variant="secondary" onClick={() => window.history.back()}>
              <ChevronLeft className="mr-1" />
              Back
            </Button>
            <CreateData projectId={projectId} datasetId={dataset_id} />
            <DownloadDataset
              projectId={projectId}
              datasetId={dataset_id}
              disabled={fetchDataset.isLoading || currentData?.length === 0}
            />
          </div>
          <div className="flex gap-4 items-center w-fit">
            <Badge variant={"outline"} className="text-sm">
              Dataset ID: {dataset_id}
            </Badge>
            <Link href={EVALUATIONS_DOCS_URL} target="_blank">
              <Button variant="outline">
                Run Evaluation
                <FlaskConical className="ml-1 h-4 w-4" />
                <ArrowTopRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns
                  <ChevronDown size={16} className="ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="h-40 overflow-y-visible">
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
                localStorage.removeItem("preferences.dataset.table-view");
              }}
            >
              <ResetIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button
          disabled={
            (!fetchDataset.isLoading && currentData.length === 0) ||
            fetchEvalMetrics.isLoading ||
            (!fetchEvalMetrics.isLoading &&
              fetchEvalMetrics.data?.eval_metrics.length === 0)
          }
          variant={"outline"}
          className="flex self-start"
          onClick={() => setViewMetrics(!viewMetrics)}
        >
          {viewMetrics ? "Hide Metrics" : "View Metrics"}
          <AreaChartIcon className="h-4 w-4 ml-1" />
        </Button>
        {viewMetrics && (
          <div className="flex gap-4 flex-col w-full border rounded-md p-2">
            <div className="flex gap-4 items-center">
              {!fetchEvalMetrics.isLoading && (
                <Link
                  href={`/project/${projectId}/evaluations?dataset_id=${dataset_id}`}
                >
                  <Button
                    variant={"secondary"}
                    className="flex items-center gap-0"
                  >
                    Evaluations
                    <ArrowTopRightIcon className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            {!fetchEvalMetrics.isLoading && (
              <div className="flex flex-row gap-4 pb-6 overflow-x-scroll">
                <ModelScorerMetricsChart
                  data={fetchEvalMetrics?.data?.scorer_metrics || {}}
                />
              </div>
            )}
            {!fetchEvalMetrics.isLoading && (
              <div className="flex flex-row gap-4 pb-12 overflow-x-scroll">
                <ModelEvalMetricsChart
                  data={fetchEvalMetrics?.data?.eval_metrics || {}}
                />
              </div>
            )}
          </div>
        )}
        <div
          className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll"
          ref={scrollableDivRef as any}
        >
          {!fetchDataset.isLoading && currentData.length === 0 && (
            <div className="flex items-center justify-center mt-24">
              <p className="text-muted-foreground">
                No data found in this dataset
              </p>
            </div>
          )}
          {!fetchDataset.isLoading &&
            currentData &&
            currentData?.length > 0 && (
              <Table style={{ ...columnSizeVars, width: table.getTotalSize() }}>
                <TableHeader className="sticky top-0 bg-secondary">
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
}

function PageSkeleton() {
  return (
    <div className="w-full py-6 px-6 flex flex-col gap-4">
      <div className="flex gap-4 items-center w-fit">
        <Button
          disabled={true}
          variant="secondary"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="mr-1" />
          Back
        </Button>
        <CreateData disabled={true} />
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
        <div className="grid grid-cols-5 items-center justify-stretch gap-3 py-3 px-4 bg-muted">
          <p className="text-xs font-medium">Input</p>
          <p className="text-xs font-medium">Output</p>
          <p className="text-xs font-medium">Expected Output</p>
          <p className="text-xs font-medium">Model</p>
          <p className="text-xs font-medium text-end">Note</p>
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <DatasetRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
