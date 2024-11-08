import { SetupInstructions } from "@/components/shared/setup-instructions";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HOW_TO_GROUP_RELATED_OPERATIONS } from "@/lib/constants";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { Trace } from "@/lib/trace_util";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@mui/material";
import { ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RowSkeleton from "../../shared/row-skeleton";
import { TableSkeleton } from "./table-skeleton";
import { TraceSheet } from "./trace-sheet";
import { TracesDownload } from "./traces-download";

interface TracesTableProps<TData, TValue> {
  project_id: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  fetching?: boolean;
  refetch: () => void;
  paginationLoading?: boolean;
  scrollableDivRef?: React.RefObject<HTMLElement>;
  filters: PropertyFilter[];
  setFilters: (filters: PropertyFilter[]) => void;
}

export function TracesTable<TData, TValue>({
  project_id,
  columns,
  data,
  loading,
  fetching,
  refetch,
  paginationLoading,
  scrollableDivRef,
  filters,
  setFilters,
}: TracesTableProps<TData, TValue>) {
  const [tableState, setTableState] = useState<any>({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [profileMode, setProfileMode] = useState(false);

  useEffect(() => {
    const newMode = profileMode ? "prompt" : "trace";
    setColumnVisibility({
      start_time: true,
      models: true,
      inputs: true,
      outputs: true,
      status: newMode === "trace",
      session_id: newMode === "trace",
      namespace: newMode === "trace",
      user_ids: newMode === "trace",
      prompt_ids: newMode === "trace",
      vendors: newMode === "trace",
      input_tokens: newMode === "trace",
      output_tokens: newMode === "trace",
      total_tokens: newMode === "trace",
      input_cost: newMode === "trace",
      output_cost: newMode === "trace",
      total_cost: newMode === "trace",
      total_duration: newMode === "trace",
    });
    if (newMode === "prompt") {
      setFilters([
        ...filters,
        {
          key: "langtrace.service.type",
          operation: "EQUALS",
          value: "llm",
          type: "attribute",
        },
      ]);
    } else {
      setFilters(filters.filter((filter) => filter.value !== "llm"));
    }
  }, [profileMode]);

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
    <>
      {!loading && data && data.length > 0 && (
        <div className="flex justify-between items-center z-99">
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-center">
              <Button variant="outline" size={"icon"} onClick={() => refetch()}>
                <RefreshCwIcon className="w-4 h-4" />
              </Button>
              <p
                className={cn(
                  "text-xs font-semibold",
                  fetching ? "text-orange-500" : "text-muted-foreground"
                )}
              >
                {fetching
                  ? "Fetching traces..."
                  : `Fetched the last ${data.length} traces`}
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Seeing related spans as separate rows?{" "}
              <Link
                className="text-blue-500 underline"
                href={HOW_TO_GROUP_RELATED_OPERATIONS}
                target="_blank"
              >
                Learn how to group spans
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-muted px-2 py-1">
              <p className="text-sm font-semibold text-orange-600">I am</p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  !profileMode ? "text-orange-600" : "text-muted-foreground"
                )}
              >
                debugging
              </p>
              <Switch
                checked={profileMode}
                onCheckedChange={(checked) => setProfileMode(checked)}
                className="relative inline-flex items-center cursor-pointer"
              />
              <p
                className={cn(
                  "text-sm font-semibold",
                  profileMode ? "text-orange-500" : "text-muted-foreground"
                )}
              >
                prompt engineering
              </p>
            </div>
            <Badge variant={"outline"} className="text-sm">
              Project ID: {project_id}
            </Badge>
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
            <TracesDownload project_id={project_id} />
          </div>
        </div>
      )}
      <div
        className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll"
        ref={scrollableDivRef as any}
      >
        {loading && <TableSkeleton />}
        {!loading && (!data || data.length === 0) && (
          <div className="flex flex-col gap-3 items-center justify-center p-4">
            <div className="flex gap-2">
              <CircularProgress size={15} />
              <p className="text-orange-500 text-sm mb-3">
                Looking for new traces...
              </p>
            </div>
            <SetupInstructions project_id={project_id} />
          </div>
        )}
        {!loading && data && data.length > 0 && (
          <Table style={{ ...columnSizeVars, minWidth: table.getTotalSize() }}>
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
              {fetching && (
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
                    setSelectedTrace(data[row.index] as Trace);
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
        {paginationLoading && (
          <div className="flex flex-col gap-3">
            <Separator />
            {Array.from({ length: 2 }).map((_, index) => (
              <RowSkeleton key={index} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
