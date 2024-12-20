"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVALUATIONS_DOCS_URL } from "@/lib/constants";
import { processRun, RunView } from "@/lib/run_util";
import { ArrowTopRightIcon, ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Compare() {
  const router = useRouter();
  // get run id from query params
  const searchParams = useSearchParams();
  const projectId = useParams()?.project_id as string;
  const runIds = searchParams.getAll("run_id") as string[];
  const [isComparable, setIsComparable] = useState<boolean>(false);
  const [runs, setRuns] = useState<RunView[]>([]);
  const [tableState, setTableState] = useState<any>({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openDropdown, setOpenDropdown] = useState(false);

  const { isLoading: experimentsLoading, error: experimentsError } = useQuery({
    queryKey: ["fetch-runs-query", projectId, ...runIds],
    queryFn: async () => {
      const fetchPromises = runIds.map(async (runId) => {
        const response = await fetch(
          `/api/run?projectId=${projectId}&runId=${runId}`
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error?.message || "Failed to fetch the evaluation");
        }
        const result = await response.json();
        return result.run;
      });
      const exps = await Promise.all(fetchPromises);
      const processedRuns: RunView[] = [];
      for (let i = 0; i < exps.length; i++) {
        const run = processRun(exps[i]);
        processedRuns.push(run);
      }
      setRuns(processedRuns);
      setIsComparable(verifyIfSampleInputsMatch(processedRuns));
      return exps;
    },
    onError: (error) => {
      toast.error("Failed to fetch one or more evaluations", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedState = window.localStorage.getItem(
          "preferences.compare.table-view"
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

  const columns: ColumnDef<RunView>[] = [
    {
      accessorKey: "input",
      size: 500,
      enableResizing: true,
      header: "Input",
      cell: ({ row }) => {
        const input = row.original.samples[0].input;
        return <p className="text-sm">{input}</p>;
      },
    },
    {
      accessorKey: "target",
      size: 500,
      enableResizing: true,
      header: "Target",
      cell: ({ row }) => {
        const target = row.original.samples[0].target;
        return <p className="text-sm">{target}</p>;
      },
    },
    ...runs.map((run, i) => ({
      accessorKey: `output-${i}`,
      size: 500,
      enableResizing: true,
      header: `Output - (${run.model})`,
      cell: ({ row }: any) => {
        const output = row.original.samples[i].output;
        return (
          <div className="flex flex-col gap-2">
            <Badge variant={"secondary"} className="w-fit">
              {run.model}
            </Badge>
            <p className="text-sm">{output}</p>
          </div>
        );
      },
    })),
  ];

  const table = useReactTable({
    data: runs || [],
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
        "preferences.compare.table-view",
        JSON.stringify(currState)
      );
    },
    onColumnVisibilityChange: (newVisibility) => {
      setColumnVisibility(newVisibility);
      const currState = table.getState();
      localStorage.setItem(
        "preferences.compare.table-view",
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
      <Button variant="outline" className="w-fit" onClick={() => router.back()}>
        <ChevronLeft className="text-muted-foreground" size={20} />
        Back
      </Button>
      <div className="flex flex-col gap-2">
        <h1 className="text-md font-semibold">Comparing Runs</h1>
        <p className="text-sm w-1/2">{runIds.join(", ")}</p>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center gap-2">
          <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="h-36 overflow-y-visible">
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
              localStorage.removeItem("preferences.compare.table-view");
            }}
          >
            <ResetIcon className="w-4 h-4" />
          </Button>
        </div>
        {(experimentsError as any) && (
          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-center text-md">
              Failed to fetch evaluations for comparison.
            </p>
            <Button onClick={() => router.back()}>
              <ChevronLeft className="text-muted-foreground" size={20} />
              Back
            </Button>
          </div>
        )}
        {!experimentsLoading &&
          !experimentsError &&
          (!runs ||
            (runs?.length === 0 && (
              <div className="flex flex-col items-center gap-2 mt-6">
                <p className="text-center text-md">
                  No evaluations found for comparison.
                </p>
                <Link href={EVALUATIONS_DOCS_URL} target="_blank">
                  <Button className="w-fit">
                    New Evaluation
                    <FlaskConical className="ml-1 h-4 w-4" />
                    <ArrowTopRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )))}
        {!experimentsLoading && runs?.length > 0 && !isComparable && (
          <div className="flex flex-col items-center gap-2 mt-24">
            <p className="text-center text-md">
              The selected evaluations are not comparable. Please select
              evaluations ran against the same dataset.
            </p>
            <Button onClick={() => router.back()}>
              <ChevronLeft className="text-muted-foreground" size={20} />
              Back
            </Button>
          </div>
        )}
        {!experimentsLoading && isComparable && runs.length > 0 && (
          <div className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll">
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
          </div>
        )}
        {experimentsLoading && <Skeleton className="w-full h-96" />}
      </div>
    </div>
  );
}

function verifyIfSampleInputsMatch(runs: RunView[]): boolean {
  if (runs.length === 0) return false;

  // also check if the length of samples is the same for all experiments
  for (let j = 1; j < runs?.length; j++) {
    if (runs[j]?.samples?.length !== runs[0]?.samples?.length) return false;
  }

  // iterate through each experiment and each sample and check if the input of sample at index i matches with the input of sample at index i for all experiments
  for (let i = 0; i < runs[0]?.samples?.length; i++) {
    const input = runs[0]?.samples[i]?.input;
    for (let j = 1; j < runs?.length; j++) {
      if (JSON.stringify(input) !== JSON.stringify(runs[j]?.samples[i]?.input))
        return false;
    }
  }

  return true;
}
