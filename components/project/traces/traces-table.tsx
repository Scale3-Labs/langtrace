import { SetupInstructions } from "@/components/shared/setup-instructions";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trace } from "@/lib/trace_util";
import { ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TraceSheet } from "./trace-sheet";

interface TracesTableProps<TData, TValue> {
  project_id: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  paginationLoading?: boolean;
  scrollableDivRef?: React.RefObject<HTMLElement>;
}

export function TracesTable<TData, TValue>({
  project_id,
  columns,
  data,
  loading,
  paginationLoading,
  scrollableDivRef,
}: TracesTableProps<TData, TValue>) {
  const [tableState, setTableState] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);
  const [dataIndex, setDataIndex] = useState<number | null>(null);

  useEffect(() => {
    // fetch preferences from local storage
    if (typeof window !== "undefined") {
      const initState = window.localStorage.getItem(
        "preferences.traces.table-view"
      );
      const parsedInitState = JSON.parse(initState || "{}");
      setTableState(parsedInitState);
      if (parsedInitState.columnVisibility)
        setColumnVisibility(parsedInitState.columnVisibility);
    }
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      ...tableState,
      columnVisibility,
    },
    state: {
      ...tableState,
      columnVisibility,
    },
    onStateChange: (newState) => {
      setTableState(newState);
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
      )}
      <div
        className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll"
        ref={scrollableDivRef as any}
      >
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
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    setDataIndex(row.index);
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
        {dataIndex !== null && (data[dataIndex] as Trace) && (
          <TraceSheet
            trace={data[dataIndex] as Trace}
            open={openSheet}
            setOpen={setOpenSheet}
          />
        )}
        {paginationLoading && (
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8 text-center" />
          </div>
        )}
      </div>
    </>
  );
}
