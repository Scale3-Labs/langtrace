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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info } from "@/components/shared/info";
import { HOW_TO_GROUP_RELATED_OPERATIONS } from "@/lib/constants";
import { Trace } from "@/lib/trace_util";
import { cn } from "@/lib/utils";
import { ResetIcon } from "@radix-ui/react-icons";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { Switch } from "@/components/ui/switch";
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
  const [viewMode, setViewMode] = useState<"trace" | "prompt">("trace");

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
        <div className="flex justify-between items-center">
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
            <div className="flex-col">
              <div className="flex items-center gap-4 ">
                <p className="text-xs font-semibold">Trace</p>
                <Switch
                  checked={viewMode === "prompt"}
                  onCheckedChange={(checked) => {
                    const newMode = checked ? "prompt" : "trace";
                    setViewMode(newMode);
                    if (newMode === "prompt") {
                      setColumnVisibility({
                        start_time: true,
                        models: true,
                        inputs: true,
                        outputs: true,
                        status: false,
                        namespace: false,
                        user_ids: false,
                        prompt_ids: false,
                        vendors: false,
                        input_tokens: false,
                        output_tokens: false,
                        total_tokens: false,
                        input_cost: false,
                        output_cost: false,
                        total_cost: false,
                        total_duration: false,
                      });
                      if (!filters.some((filter) => filter.value === "llm")) {
                        setFilters([
                          ...filters,
                          {
                            key: "langtrace.service.type",
                            operation: "EQUALS",
                            value: "llm",
                            type: "attribute",
                          },
                        ]);
                      }
                    } else {
                      setColumnVisibility({
                        start_time: true,
                        models: true,
                        inputs: true,
                        outputs: true,
                        status: true,
                        namespace: true,
                        user_ids: true,
                        prompt_ids: true,
                        vendors: true,
                        input_tokens: true,
                        output_tokens: true,
                        total_tokens: true,
                        input_cost: true,
                        output_cost: true,
                        total_cost: true,
                        total_duration: true,
                      });
                      setFilters(
                        filters.filter((filter) => filter.value !== "llm")
                      );
                    }
                  }}
                  className="relative inline-flex items-center cursor-pointer"
                >
                  <span
                    className={`${
                      viewMode === "prompt" ? "translate-x-5" : "translate-x-0"
                    } inline-block w-10 h-6 bg-gray-200 rounded-full transition-transform`}
                  />
                </Switch>
                <p className="text-xs font-semibold">Prompt</p>
                <Info
                  className="ml-[-10px]"
                  information={
                    "Switch to a condensed view optimized for debugging Prompts."
                  }
                />
              </div>
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
            <p className="text-muted-foreground text-sm mb-3">
              No traces available. Get started by setting up Langtrace in your
              application.
            </p>
            <SetupInstructions project_id={project_id} />
          </div>
        )}
        {!loading && data && data.length > 0 && (
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
