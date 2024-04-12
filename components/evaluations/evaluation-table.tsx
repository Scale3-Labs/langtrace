"use client";

import { TestSetupInstructions } from "@/components/shared/setup-instructions";
import { Spinner } from "@/components/shared/spinner";
import { PAGE_SIZE } from "@/lib/constants";
import { Test } from "@prisma/client";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import RowSkeleton from "../project/traces/row-skeleton";
import EvaluationRow from "./evaluation-row";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function EvaluationTable({
  projectId,
  test,
  selectedData,
  setSelectedData,
  currentData,
  setCurrentData,
  page,
  setPage,
  totalPages,
  setTotalPages,
}: {
  projectId: string;
  test: Test;
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

  const onCheckedChange = (data: CheckedData, checked: boolean) => {
    if (checked) {
      setSelectedData([...selectedData, data]);
    } else {
      setSelectedData(selectedData.filter((d) => d.spanId !== data.spanId));
    }
  };

  const fetchLlmPromptSpans = useQuery({
    queryKey: [`fetch-llm-prompt-spans-${test.id}-query`],
    queryFn: async () => {
      const filters = [
        {
          key: "llm.prompts",
          operation: "NOT_EQUALS",
          value: "",
        },
        // Accuracy is the default test. So no need to
        // send the testId with the spans when using the SDK.
        {
          key: "langtrace.testId",
          operation: "EQUALS",
          value: test.name.toLowerCase() !== "factual accuracy" ? test.id : "",
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

        setCurrentData(uniqueData);
      } else {
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
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      {currentData.length > 0 && (
        <div className="grid grid-cols-13 items-center gap-3 py-3 px-4 bg-muted rounded-t-md">
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
          <p className="text-xs font-medium">Added to Dataset</p>
        </div>
      )}
      {fetchLlmPromptSpans.isLoading ||
      !fetchLlmPromptSpans.data ||
      !currentData ? (
        <TableLoading />
      ) : (
        currentData.map((span: any, i: number) => (
          <EvaluationRow
            key={i}
            span={span}
            projectId={projectId}
            testId={test.id}
            onCheckedChange={onCheckedChange}
            selectedData={selectedData}
          />
        ))
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
            <TestSetupInstructions testId={test.id} />
          </div>
        )}
    </div>
  );
}

export function TableLoading() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      <div className="grid grid-cols-13 items-center gap-3 py-3 px-4 bg-muted rounded-t-md">
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
        <p className="text-xs font-medium">Added to Dataset</p>
      </div>
      {Array.from({ length: 5 }).map((span: any, i: number) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}
