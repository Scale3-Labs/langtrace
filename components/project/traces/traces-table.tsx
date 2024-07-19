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
import { ChevronDown, SaveIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TraceSheet } from "./trace-sheet";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initState?: any;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initState,
}: DataTableProps<TData, TValue>) {
  const initialState = JSON.parse(initState || "{}");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility || {}
  );
  const [openDropdown, setOpenDropdown] = useState(false);
  const [tableState, setTableState] = useState(initialState);
  const [openSheet, setOpenSheet] = useState(false);
  const [dataIndex, setDataIndex] = useState<number | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onStateChange: setTableState,
    state: {
      columnVisibility,
      ...tableState,
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
          onClick={() => {
            const view = table.getState();
            localStorage.setItem(
              "preferences.traces.table-view",
              JSON.stringify(view)
            );
            toast.success("Preferences updated.");
          }}
        >
          <SaveIcon size={16} />
        </Button>
        <Button
          size={"icon"}
          variant={"destructive"}
          onClick={() => {
            setTableState({});
            setColumnVisibility({});
          }}
        >
          <ResetIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="rounded-md border overflow-auto">
        <Table style={{ ...columnSizeVars, width: table.getTotalSize() }}>
          <TableHeader>
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {dataIndex !== null && (
          <TraceSheet
            trace={data[dataIndex] as Trace}
            open={openSheet}
            setOpen={setOpenSheet}
          />
        )}
      </div>
    </>
  );
}
