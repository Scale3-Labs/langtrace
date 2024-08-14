"use client";

import { Conversation } from "@/components/shared/conversation-view";
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
import { EVALUATIONS_DOCS_URL } from "@/lib/constants";
import { processRun, RunSample, RunView } from "@/lib/run_util";
import { cn } from "@/lib/utils";
import { ArrowTopRightIcon, ResetIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Evaluation() {
  const router = useRouter();
  const runId = useParams()?.run_id as string;
  const projectId = useParams()?.project_id as string;
  const [run, setRun] = useState<RunView>();
  const [tableState, setTableState] = useState<any>({
    pagination: {
      pageIndex: 0,
      pageSize: 100,
    },
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [messages, setMessages] = useState<any>();
  const [plan, setPlan] = useState<any>();
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  const { isLoading: runLoading } = useQuery({
    queryKey: ["fetch-runs-query", projectId, runId],
    queryFn: async () => {
      const response = await fetch(
        `/api/run?projectId=${projectId}&runId=${runId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch the evaluation");
      }
      const result = await response.json();
      if (!result.run || !result.run.log) {
        throw new Error("No evaluations found");
      }
      const processedRun = processRun(result.run);
      setRun(processedRun);
      setPlan(processedRun.plan);
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch the evaluation", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedState = window.localStorage.getItem(
          "preferences.run.table-view"
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

  const columns: ColumnDef<RunSample>[] = [
    {
      accessorKey: "input",
      size: 500,
      enableResizing: true,
      header: "Input",
      cell: ({ row }) => {
        const input = row.getValue("input") as string;
        return <p className="text-sm font-semibold">{input}</p>;
      },
    },
    {
      accessorKey: "target",
      size: 500,
      enableResizing: true,
      header: "Target",
      cell: ({ row }) => {
        const target = row.getValue("target") as string;
        return <p className="text-sm font-semibold">{target}</p>;
      },
    },
    {
      accessorKey: "output",
      size: 500,
      enableResizing: true,
      header: "Output",
      cell: ({ row }) => {
        const output = row.getValue("output") as string;
        return <p className="text-sm font-semibold">{output}</p>;
      },
    },
    {
      accessorKey: "model",
      size: 200,
      enableResizing: true,
      header: "Model",
      cell: ({ row }) => {
        return <p className="text-sm font-semibold">{run?.model}</p>;
      },
    },
    {
      accessorKey: "scores",
      size: 200,
      enableResizing: true,
      header: "Scores",
      cell: ({ row }) => {
        const scores = row.getValue("scores") as {
          scorer: string;
          value: string;
          explanation: string;
        }[];
        return (
          <div className="flex gap-2 flex-wrap">
            {scores.map((score, idx) => {
              // remove underscore from scorer
              let scorer = score?.scorer?.replace(/_/g, " ") || "";
              // capitalize the entire scorer
              if (scorer) {
                scorer = scorer.toUpperCase();
              }
              return (
                <Badge key={idx} className="flex gap-2">
                  <p className="text-xs">{scorer}:</p>
                  <p className="text-xl font-bold">{score.value}</p>
                </Badge>
              );
            })}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: run?.samples || [],
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
        "preferences.run.table-view",
        JSON.stringify(currState)
      );
    },
    onColumnVisibilityChange: (newVisibility) => {
      setColumnVisibility(newVisibility);
      const currState = table.getState();
      localStorage.setItem(
        "preferences.run.table-view",
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
      <div className="px-12 py-12 flex justify-between bg-muted">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">Run ID</h1>
            <p className="text-sm text-muted-foreground font-semibold">
              {runId}
            </p>
          </div>
          {!runLoading && (
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold">Dataset ID</h1>
              <p className="text-sm text-muted-foreground font-semibold">
                {run?.dataset_id || ""}
              </p>
            </div>
          )}
          {!runLoading && run && (
            <Badge
              className={cn(
                "capitalize w-fit",
                run.status === "success"
                  ? "text-black bg-green-500"
                  : "text-black bg-destructive"
              )}
            >
              {run.status}
            </Badge>
          )}
        </div>
        <Link href={EVALUATIONS_DOCS_URL} target="_blank">
          <Button
            variant={run && run?.samples?.length > 0 ? "outline" : "default"}
          >
            New Evaluation
            <FlaskConical className="ml-1 h-4 w-4" />
            <ArrowTopRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="flex flex-col gap-6 w-full px-12">
        <div className="flex gap-2">
          {run?.scores?.map((score, i) => (
            <div
              className="flex flex-col gap-0 p-2 border rounded-md border-muted bg-muted shadow-md"
              key={i}
            >
              <p className="text-md font-semibold mb-3">{score.scorer}</p>
              {score?.metrics.map((metric, j) => (
                <div className="flex gap-2" key={j}>
                  <p className="text-sm font-semibold capitalize">
                    {metric.name}:
                  </p>
                  <p className="text-sm font-semibold">
                    {parseFloat(metric.value).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ChevronLeft className="text-muted-foreground" size={20} />
              Back
            </Button>
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
                localStorage.removeItem("preferences.run.table-view");
              }}
            >
              <ResetIcon className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {!runLoading && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground font-semibold">
                  Total Samples: {run?.samples?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground font-semibold">
                  Model: {run?.model || "N/A"}
                </p>
              </div>
            )}
          </div>
        </div>
        {run?.error && (
          <div className="flex flex-col gap-4 items-center">
            <p className="text-sm text-muted-foreground text-center font-semibold">
              An error occurred while running this evaluation. See below for
              more details
            </p>
            <div className="text-xs flex flex-col gap-2 p-2 border border-muted rounded-md text-muted-foreground">
              <pre className="text-start text-md">
                {run?.error?.message || "An error occurred."}
              </pre>
              <pre className="text-start text-sm">
                {run?.error?.traceback || "No traceback available."}
              </pre>
            </div>
          </div>
        )}
        {!run?.error &&
          ((!runLoading && !run?.samples) || run?.samples?.length === 0) && (
            <div className="flex flex-col items-center gap-2 mt-6">
              <p className="text-center text-md">
                No samples found for this evaluation.
              </p>
              <Link href={EVALUATIONS_DOCS_URL} target="_blank">
                <Button className="w-fit">
                  New Evaluation
                  <FlaskConical className="ml-1 h-4 w-4" />
                  <ArrowTopRightIcon className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        {!run?.error &&
          !runLoading &&
          run?.samples &&
          run?.samples?.length > 0 && (
            <div className="rounded-md border flex flex-col relative h-[75vh] overflow-y-scroll">
              <EvaluationConversation
                model={run?.model}
                plan={plan}
                messages={messages}
                open={open}
                setOpen={setOpen}
              />
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
                      onClick={() => {
                        setMessages(row.original.messages);
                        setOpen(true);
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
            </div>
          )}
        {runLoading && <Skeleton className="w-full h-96" />}
      </div>
    </div>
  );
}

function EvaluationConversation({
  open,
  setOpen,
  model,
  plan,
  messages,
}: {
  open: boolean;
  setOpen: any;
  model: string;
  plan: any;
  messages: any;
}) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className={"overflow-y-scroll w-1/4"}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader>
          <SheetTitle>Evaluation Plan</SheetTitle>
          <SheetDescription>
            Evaluation plan and the messages exchanged during the evaluation
            run.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-3" />
        <p className="text-medium my-3 font-semibold">Plan</p>
        <div className="flex my-4 gap-2 flex-wrap items-center">
          {plan.steps.map((step: any, i: number) => (
            <div className="flex gap-2 items-center" key={i}>
              <Badge variant={"outline"}>{step}</Badge>
              {i < plan.steps.length - 1 && <ChevronRight size={12} />}
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <p className="text-medium my-3 font-semibold">Messages</p>
        <Conversation messages={messages} model={model} />
      </SheetContent>
    </Sheet>
  );
}
