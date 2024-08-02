"use client";

import { AnnotationsTable } from "@/components/annotations/annotations-table";
import { CreateTest } from "@/components/annotations/create-test";
import { EditTest } from "@/components/annotations/edit-test";
import { TableSkeleton } from "@/components/project/traces/table-skeleton";
import { AddtoDataset } from "@/components/shared/add-to-dataset";
import { HoverCell } from "@/components/shared/hover-cell";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PAGE_SIZE } from "@/lib/constants";
import { LLMSpan, processLLMSpan } from "@/lib/llm_span_util";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { cn, formatDateTime } from "@/lib/utils";
import { Skeleton } from "@mui/material";
import { Evaluation, Test } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { RabbitIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function PageClient({ email }: { email: string }) {
  const projectId = useParams()?.project_id as string;
  const [currentData, setCurrentData] = useState<any>([]);
  const [processedData, setProcessedData] = useState<LLMSpan[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedData, setSelectedData] = useState<CheckedData[]>([]);
  const [showBottomLoader, setShowBottomLoader] = useState(false);

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchLlmPromptSpans.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowBottomLoader(true);
      fetchLlmPromptSpans.refetch();
    }
  });

  const fetchLlmPromptSpans = useQuery({
    queryKey: ["fetch-llm-prompt-spans-query"],
    queryFn: async () => {
      const filters = {
        filters: [
          {
            operation: "OR",
            filters: [
              {
                key: "llm.prompts",
                operation: "NOT_EQUALS",
                value: "",
                type: "attribute",
              },
              {
                key: "name",
                operation: "EQUALS",
                value: "gen_ai.content.prompt",
                type: "event",
              },
            ],
          },
          {
            key: "status_code",
            operation: "EQUALS",
            value: "OK",
            type: "property",
          },
        ],
        operation: "AND",
      };

      // convert filterserviceType to a string
      const apiEndpoint = "/api/spans";
      const body = {
        page,
        pageSize: PAGE_SIZE,
        projectId: projectId,
        filters: filters,
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const newData = data?.spans?.result || [];
      const metadata = data?.spans?.metadata || {};

      // Update the total pages and current page number
      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      const updatedData = [];
      if (currentData.length > 0) {
        updatedData.push(...currentData, ...newData);
      } else {
        updatedData.push(...newData);
      }
      // Remove duplicates
      const uniqueData = updatedData.filter(
        (v: any, i: number, a: any) =>
          a.findIndex((t: any) => t.span_id === v.span_id) === i
      );

      // sort by timestamp
      uniqueData.sort((a: any, b: any) => {
        if (!a.start_time || !b.start_time) {
          return 0;
        }
        return (
          new Date(correctTimestampFormat(b.start_time)).valueOf() -
          new Date(correctTimestampFormat(a.start_time)).valueOf()
        );
      });

      const pData: LLMSpan[] = [];
      for (const span of uniqueData) {
        const processedSpan = processLLMSpan(span);
        if (!processedSpan) {
          continue;
        }
        pData.push(processedSpan);
      }
      setProcessedData(pData);
      setCurrentData(uniqueData);
      setShowBottomLoader(false);
    },
    onError: (error) => {
      setShowBottomLoader(false);
      toast.error("Failed to fetch traces", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const [columns, setColumns] = useState<ColumnDef<LLMSpan & any>[]>([
    {
      size: 50,
      accessorKey: "check_box",
      header: "Select",
      cell: ({ row }) => {
        try {
          const spanId = row.original.span_id;
          const prompts = row.getValue("input") as string[];
          const responses = row.getValue("output") as string[];

          let input = "";
          if (prompts && prompts.length > 0) {
            // get last item in prompts
            const lastItem = prompts[prompts.length - 1];
            input =
              JSON.parse(lastItem)[0]?.content ||
              JSON.parse(lastItem)[0]?.message?.content ||
              JSON.parse(lastItem)[0]?.text;

            // check if input is not a string
            if (typeof input !== "string") {
              input = JSON.stringify(input);
            }
          }

          let output = "";
          if (responses && responses.length > 0) {
            // get last item in responses
            const lastItem = responses[responses.length - 1];
            output =
              JSON.parse(lastItem)[0]?.message?.content ||
              JSON.parse(lastItem)[0]?.text ||
              JSON.parse(lastItem)[0]?.content;

            // check if output is not a string
            if (typeof output !== "string") {
              output = JSON.stringify(output);
            }
          }

          return (
            <Checkbox
              id={spanId}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={(checked: boolean) => {
                const checkedData = {
                  spanId,
                  input,
                  output,
                };
                if (checked) {
                  setSelectedData([...selectedData, checkedData]);
                } else {
                  setSelectedData(
                    selectedData.filter((d) => d.spanId !== spanId)
                  );
                }
              }}
            />
          );
        } catch (e) {
          // fallback to disabled checkbox
          return <Checkbox id={row.original.span_id} disabled={true} />;
        }
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
      accessorKey: "model",
      header: "Model",
      cell: ({ row }) => {
        const model = row.getValue("model") as string[];
        return (
          <Badge variant="secondary" className="lowercase">
            {model}
          </Badge>
        );
      },
    },
    {
      size: 500,
      accessorKey: "input",
      header: "Input",
      cell: ({ row }) => {
        const input = row.getValue("input") as string[];
        if (!input) {
          return null;
        }
        return (
          <div className="flex flex-col gap-3 flex-wrap w-full">
            {input.map((item, i) => (
              <HoverCell
                key={i}
                values={JSON.parse(item)}
                className={cn(
                  "text-sm overflow-y-scroll bg-muted p-[6px] rounded-md",
                  false ? "" : "max-h-10"
                )}
              />
            ))}
          </div>
        );
      },
    },
    {
      size: 500,
      accessorKey: "output",
      header: "Output",
      cell: ({ row }) => {
        const output = row.getValue("output") as string[];
        if (!output) {
          return null;
        }
        return (
          <div className="flex flex-col gap-3 flex-wrap w-full">
            {output.map((item, i) => (
              <HoverCell
                key={i}
                values={JSON.parse(item)}
                className={cn(
                  "text-sm overflow-y-scroll bg-muted p-[6px] rounded-md",
                  false ? "" : "max-h-10"
                )}
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "prompt_id",
      header: "Prompt ID",
      cell: ({ row }) => {
        const promptId = row.getValue("prompt_id") as string[];
        return (
          <Badge variant="secondary" className="lowercase">
            {promptId ? promptId : "Not Reported"}
          </Badge>
        );
      },
    },
  ]);

  const {
    data: tests,
    isLoading: testsLoading,
    error: testsError,
  } = useQuery({
    queryKey: ["fetch-tests-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/test?projectId=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch tests");
      }
      const result = await response.json();

      // sort tests by created date
      result.tests.sort(
        (a: Test, b: Test) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // add it to the front of the result.tests
      result.tests.unshift(
        {
          id: "user_id",
          name: "user ID",
        },
        {
          id: "user_score",
          name: "user score",
        }
      );

      result.tests.forEach((test: Test) => {
        setColumns((columns) => [
          ...columns,
          {
            accessorKey: `test_${test.id}`,
            header: test.name[0].toUpperCase() + test.name.slice(1),
            cell: ({ row }) => {
              const isEval = test.id !== "user_id";
              const spanId = row.original.span_id;
              const testId = test.id;
              const { isError, isLoading, data } = useQuery({
                queryKey: ["fetch-evaluation-query", spanId],
                queryFn: async () => {
                  const response = await fetch(
                    `/api/evaluation?spanId=${spanId}&projectId=${projectId}&includeTest=true`
                  );
                  const result = await response.json();
                  const evaluations =
                    result.evaluations.length > 0 ? result.evaluations : [];
                  return evaluations;
                },
              });
              if (isError || !data || data?.length === 0) {
                return (
                  <p className="text-xs">
                    {isEval ? "Not Evaluated" : "Not Reported"}
                  </p>
                );
              }
              if (isLoading) {
                return <Skeleton variant="text" />;
              }

              if (isEval) {
                const evaluation = data?.find(
                  (e: Evaluation) => e.testId === testId
                );
                return (
                  <p className="text-xs">
                    {evaluation ? evaluation.ltUserScore : "Not evaluated"}
                  </p>
                );
              }

              const userScore = data[0]?.userScore || "";
              const userId = data[0]?.userId || "Not Reported";
              if (test.id === "user_id") {
                return (
                  <Badge variant="secondary" className="lowercase">
                    {userId}
                  </Badge>
                );
              }
              return <p className="text-xs">{userScore}</p>;
            },
          },
        ]);
      });

      // remove user_id and user_score from result.tests
      result.tests = result.tests.filter(
        (test: Test) => test.id !== "user_id" && test.id !== "user_score"
      );

      return result.tests as Test[];
    },
    refetchOnWindowFocus: false,
    onError: (error) => {
      toast.error("Failed to fetch tests", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (testsError) {
    return (
      <div className="md:px-52 px-12 py-12 flex flex-col items-center justify-center">
        <RabbitIcon size={80} />
        <p className="text-lg font-semibold">
          An error occurred while fetching tests. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">
          Annotate & Evaluate Conversations
        </h1>
        <div className="flex gap-2">
          <CreateTest projectId={projectId} variant={"outline"} />
          {tests && tests?.length > 0 && (
            <EditTest projectId={projectId} tests={tests} />
          )}
        </div>
      </div>
      {testsLoading || !tests ? (
        <div className="flex flex-col gap-8 top-[16rem] w-full md:px-24 px-12 mb-24">
          <AddtoDataset
            projectId={projectId}
            selectedData={selectedData}
            className="w-fit self-end"
          />
          <TableSkeleton />
        </div>
      ) : tests?.length > 0 ? (
        <div className="flex flex-col gap-8 top-[16rem] w-full md:px-24 px-12 mb-24">
          <AddtoDataset
            projectId={projectId}
            selectedData={selectedData}
            className="w-fit self-end"
          />
          <AnnotationsTable
            project_id={projectId}
            columns={columns}
            data={processedData}
            tests={tests}
            loading={fetchLlmPromptSpans.isLoading && !showBottomLoader}
            fetching={fetchLlmPromptSpans.isFetching}
            paginationLoading={showBottomLoader}
            scrollableDivRef={scrollableDivRef}
          />
        </div>
      ) : (
        <div className="md:px-52 px-12 py-12 flex flex-col gap-2 items-center justify-center">
          <p className="text-sm text-muted-foreground font-semibold">
            Create a test to get started.
          </p>
          <CreateTest projectId={projectId} />
        </div>
      )}
    </div>
  );
}
