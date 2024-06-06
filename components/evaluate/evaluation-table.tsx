import { SetupInstructions } from "@/components/shared/setup-instructions";
import { Spinner } from "@/components/shared/spinner";
import { PAGE_SIZE } from "@/lib/constants";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { Test } from "@prisma/client";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import TraceRowSkeleton from "../project/traces/trace-row-skeleton";
import EvaluationRow from "./evaluation-row";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function EvaluationTable({
  tests,
  projectId,
  selectedData,
  setSelectedData,
  currentData,
  setCurrentData,
  page,
  setPage,
  totalPages,
  setTotalPages,
}: {
  tests: Test[];
  projectId: string;
  selectedData: CheckedData[];
  setSelectedData: (data: CheckedData[]) => void;
  currentData: any;
  setCurrentData: (data: any) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (totalPages: number) => void;
}) {
  const [showLoader, setShowLoader] = useState(false);
  const [selectedSpan, setSelectedSpan] = useState();

  const onCheckedChange = (data: CheckedData, checked: boolean) => {
    if (checked) {
      setSelectedData([...selectedData, data]);
    } else {
      setSelectedData(selectedData.filter((d) => d.spanId !== data.spanId));
    }
  };

  const fetchLlmPromptSpans = useQuery({
    queryKey: ["fetch-llm-prompt-spans-query"],
    queryFn: async () => {
      const filters = [
        {
          key: "llm.prompts",
          operation: "NOT_EQUALS",
          value: "",
          type: "attribute",
        },
        {
          key: "status_code",
          operation: "EQUALS",
          value: "OK",
          type: "property",
        },
      ];

      // convert filterserviceType to a string
      const apiEndpoint = "/api/spans";
      const body = {
        page,
        pageSize: PAGE_SIZE,
        projectId: projectId,
        filters: filters,
        filterOperation: "AND",
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

      // Merge the new data with the existing data
      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];

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

        setCurrentData(uniqueData);
      } else {
        // sort by timestamp
        newData.sort((a: any, b: any) => {
          if (!a.start_time || !b.start_time) {
            return 0;
          }
          return (
            new Date(correctTimestampFormat(b.start_time)).valueOf() -
            new Date(correctTimestampFormat(a.start_time)).valueOf()
          );
        });

        setCurrentData(newData);
      }
      setShowLoader(false);
    },
  });

  useBottomScrollListener(() => {
    if (fetchLlmPromptSpans.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchLlmPromptSpans.refetch();
    }
  });

  return (
    <div className="max-h-screen overflow-y-scroll">
      {fetchLlmPromptSpans.isLoading ||
      !fetchLlmPromptSpans.data ||
      !currentData ? (
        <EvaluationTableSkeleton />
      ) : (
        <table className="table-auto overflow-x-scroll w-max border-separate border-spacing-2 border border-muted rounded-md">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 rounded-md text-xs font-medium text-left">
                Timestamp (UTC)
              </th>
              <th className="p-2 rounded-md text-xs font-medium text-left">
                Model
              </th>
              <th className="p-2 rounded-md text-xs font-medium">Input</th>
              <th className="p-2 rounded-md text-xs font-medium">Output</th>
              <th className="p-2 rounded-md text-xs font-medium">
                PII Detected
              </th>
              {tests.map((test: Test, i) => (
                <th
                  key={i}
                  className="p-2 rounded-md text-xs font-medium capitalize"
                >
                  {test.name}
                </th>
              ))}
              <th className="p-2 rounded-md text-xs font-medium">User Score</th>
              <th className="p-2 rounded-md text-xs font-medium">User Id</th>
              <th className="p-2 rounded-md text-xs font-medium text-right">
                Added to Dataset
              </th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 &&
              currentData.map((span: any, i: number) => {
                if (span.status_code !== "ERROR") {
                  return (
                    <EvaluationRow
                      key={i}
                      span={span}
                      tests={tests}
                      projectId={projectId}
                      onCheckedChange={onCheckedChange}
                      selectedData={selectedData}
                      setSelectedSpan={setSelectedSpan as any}
                      selectedSpan={selectedSpan}
                    />
                  );
                }
              })}
          </tbody>
        </table>
      )}
      {showLoader && (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8 text-center" />
        </div>
      )}
      {!fetchLlmPromptSpans.isLoading &&
        fetchLlmPromptSpans.data &&
        currentData.length === 0 && (
          <div className="flex flex-col gap-3 items-center justify-center p-4">
            <p className="text-sm text-muted-foreground font-semibold mb-3">
              Setup instructions 👇
            </p>
            <SetupInstructions project_id={projectId} />
          </div>
        )}
    </div>
  );
}

export function EvaluationTableSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      <div className="grid grid-cols-15 items-center gap-3 py-3 px-4 bg-muted rounded-t-md">
        <p className="text-xs font-medium col-span-2 text-end">
          Timestamp (UTC)
        </p>
        <p className="text-xs font-medium">Model</p>
        <p className="text-xs font-medium col-span-2">Input</p>
        <p className="text-xs font-medium col-span-2">Output</p>
        <p className="text-xs font-medium">Cost</p>
        <p className="text-xs font-medium">PII Detected</p>
        <p className="text-xs font-medium">Duration</p>
        <p className="text-xs font-medium">Evaluate</p>
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
