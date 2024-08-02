import { SetupInstructions } from "@/components/shared/setup-instructions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LLMSpan } from "@/lib/llm_span_util";
import { cn } from "@/lib/utils";
import { Evaluation, Test } from "@prisma/client";
import { ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ProgressCircle } from "@tremor/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import TraceRowSkeleton from "../project/traces/trace-row-skeleton";
import ConversationView from "../shared/conversation-view";
import { ScaleType } from "./eval-scale-picker";
import { RangeScale } from "./range-scale";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export function EvaluationTableSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      <div className="grid grid-cols-10 items-center gap-2 p-1 bg-muted rounded-t-md">
        <p className="p-2 rounded-md text-xs font-medium text-left">
          Timestamp (UTC)
        </p>
        <p className="p-2 rounded-md text-xs font-medium text-left">Model</p>
        <p className="text-xs font-medium col-span-2">Input</p>
        <p className="text-xs font-medium col-span-2">Output</p>
        <p className="text-xs font-medium">PII Detected</p>
        <p className="text-xs font-medium">User Score</p>
        <p className="text-xs font-medium">User Id</p>
        <p className="text-xs font-medium">Added to Dataset</p>
      </div>
      {Array.from({ length: 5 }).map((span: any, i: number) => (
        <TraceRowSkeleton key={i} />
      ))}
    </div>
  );
}

interface AnnotationsTableProps<TData, TValue> {
  project_id: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tests: Test[];
  loading?: boolean;
  fetching?: boolean;
  paginationLoading?: boolean;
  scrollableDivRef?: React.RefObject<HTMLElement>;
}

export function AnnotationsTable<TData, TValue>({
  project_id,
  columns,
  data,
  tests,
  loading,
  fetching,
  paginationLoading,
  scrollableDivRef,
}: AnnotationsTableProps<TData, TValue>) {
  const [tableState, setTableState] = useState<any>({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedState = window.localStorage.getItem(
          "preferences.annotations.table-view"
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
        "preferences.annotations.table-view",
        JSON.stringify(currState)
      );
    },
    onColumnVisibilityChange: (newVisibility) => {
      setColumnVisibility(newVisibility);
      const currState = table.getState();
      localStorage.setItem(
        "preferences.annotations.table-view",
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
                localStorage.removeItem("preferences.annotations.table-view");
              }}
            >
              <ResetIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      <div
        className="rounded-md border flex flex-col relative h-fit overflow-y-scroll"
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
                    console.log(data[row.index]);
                    setSelectedRow(data[row.index] as LLMSpan);
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
        {selectedRow !== null && (
          <EvaluationSheet
            span={selectedRow}
            open={openSheet}
            setOpen={setOpenSheet}
            tests={tests}
            projectId={project_id}
          />
        )}
        {paginationLoading && (
          <div className="flex flex-col gap-3">
            <Separator />
            {Array.from({ length: 2 }).map((_, index) => (
              <TraceRowSkeleton key={index} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EvaluationSheet({
  span,
  open,
  setOpen,
  tests,
  projectId,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  span: LLMSpan;
  tests: Test[];
  projectId: string;
}) {
  const {
    isError,
    isLoading,
    data: evaluations,
  } = useQuery({
    queryKey: ["fetch-evaluation-query", span.span_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/evaluation?spanId=${span.span_id}&projectId=${projectId}&includeTest=true`
      );
      const result = await response.json();
      const evaluations =
        result.evaluations.length > 0 ? result.evaluations : [];
      return evaluations as Evaluation[];
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className={cn("w-2/3 overflow-y-scroll")}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader>
          <SheetTitle>Evaluate</SheetTitle>
          <SheetDescription>
            Evaluate the input and output of this LLM request.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-row gap-2 mt-4 justify-between">
          <div className="relative w-1/2 min-w-1/2">
            <ConversationView span={span.raw_span} />
          </div>
          <div className="w-1/2 min-w-1/2 flex flex-col gap-4">
            {tests.map((test: Test, i) => {
              if (isLoading || isError) {
                return <Skeleton key={i} className="h-20" />;
              }
              const evaluation = evaluations?.find((e) => e.testId === test.id);
              return (
                <EvaluateTest
                  key={i}
                  test={test}
                  span={span}
                  projectId={projectId}
                  evaluation={evaluation}
                />
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EvaluateTest({
  test,
  span,
  projectId,
  evaluation,
}: {
  test: Test;
  projectId: string;
  span: LLMSpan;
  evaluation?: Evaluation;
}) {
  const [score, setScore] = useState(0);
  const [color, setColor] = useState("red");
  const [scorePercent, setScorePercent] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (evaluation && evaluation.ltUserScore) {
      setScore(evaluation.ltUserScore);
      onScoreSelected(test, evaluation.ltUserScore);
    }
  }, []);

  const onScoreSelected = (test: Test, value: number, submit = false) => {
    setScore(value);

    // Calculate the percentage of the score using min, max and step
    if (!test) return;
    const max = test?.max || 0;
    const min = test?.min || 0;
    const range = max - min;
    const scorePercent = ((value - min) / range) * 100;
    setScorePercent(scorePercent);

    if (scorePercent < 33) {
      setColor("red");
    }
    if (scorePercent >= 33 && scorePercent < 66) {
      setColor("yellow");
    }
    if (scorePercent >= 66) {
      setColor("green");
    }
    if (submit) {
      evaluate(value);
    }
  };

  const evaluate = async (value: number) => {
    try {
      // Check if an evaluation already exists
      if (evaluation) {
        if (evaluation.ltUserScore === value) {
          return;
        }
        // Update the existing evaluation
        await fetch("/api/evaluation", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: evaluation.id,
            ltUserScore: value,
            testId: test.id,
          }),
        });
        await queryClient.invalidateQueries({
          queryKey: ["fetch-evaluation-query", span?.span_id],
        });
      } else {
        // Create a new evaluation
        await fetch("/api/evaluation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: projectId,
            spanId: span.span_id,
            traceId: span.trace_id,
            ltUserScore: value,
            testId: test.id,
          }),
        });
        await queryClient.invalidateQueries({
          queryKey: ["fetch-evaluation-query", span?.span_id],
        });
      }
    } catch (error: any) {
      toast.error("Error evaluating the span!", {
        description: `There was an error evaluating the span: ${error.message}`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-start">
          <h2 className="text-lg font-semibold break-normal capitalize">
            {test?.name || "No name provided"}
          </h2>
          <ProgressCircle
            value={scorePercent}
            size="xs"
            color={color}
            className="relative"
          >
            <p className="text-lg font-semibold">{score}</p>
          </ProgressCircle>
        </div>
        <p className="text-sm w-3/4 text-muted-foreground">
          {test?.description || "No description provided"}
        </p>
      </div>
      <RangeScale
        variant="md"
        type={ScaleType.Range}
        min={test?.min || 0}
        max={test?.max || 0}
        step={test?.step || 0}
        selectedValue={score}
        onSelectedValueChange={(value) => onScoreSelected(test, value, true)}
      />
    </div>
  );
}
