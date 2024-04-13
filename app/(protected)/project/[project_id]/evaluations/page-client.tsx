"use client";

import { EvalChart } from "@/components/charts/eval-chart";
import LargeChartSkeleton from "@/components/charts/large-chart-skeleton";
import EvaluationTable, {
  EvaluationTableSkeleton,
} from "@/components/evaluations/evaluation-table";
import { AddtoDataset } from "@/components/shared/add-to-dataset";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getChartColor } from "@/lib/utils";
import { Test } from "@prisma/client";
import { ProgressCircle } from "@tremor/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function PageClient({ email }: { email: string }) {
  const projectId = useParams()?.project_id as string;
  const [selectedTest, setSelectedTest] = useState<Test>();
  const [selectedData, setSelectedData] = useState<CheckedData[]>([]);
  const [currentData, setCurrentData] = useState<any>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchTestAverages = useQuery({
    queryKey: [`fetch-test-averages-${projectId}-query`],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/tests?projectId=${projectId}`);
      const result = await response.json();
      return result;
    },
    refetchOnWindowFocus: false,
  });

  const fetchTests = useQuery({
    queryKey: [`fetch-tests-${projectId}-query`],
    queryFn: async () => {
      const response = await fetch(`/api/test?projectId=${projectId}`);
      const result = await response.json();
      if (result?.tests?.length > 0) {
        setSelectedTest(result?.tests?.[0]);
      }
      return result;
    },
    refetchOnWindowFocus: false,
    enabled: !!fetchTestAverages.data,
  });

  const testAverage =
    fetchTestAverages?.data?.averages?.find(
      (avg: any) => avg.testId === selectedTest?.id
    )?.average || 0;

  return (
    <div className="w-full flex flex-col">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Evaluations</h1>
        <AddtoDataset projectId={projectId} selectedData={selectedData} />
      </div>
      {fetchTests.isLoading || !fetchTests.data ? (
        <PageSkeleton />
      ) : (
        fetchTests?.data?.tests?.length > 0 && (
          <div className="flex flex-row gap-4 absolute top-[14rem] w-full md:px-24 px-12">
            <div className="bg-primary-foreground flex flex-col gap-0 border rounded-md w-[12rem] h-fit">
              {fetchTests?.data?.tests?.map((test: Test, i: number) => {
                const average =
                  fetchTestAverages?.data?.averages?.find(
                    (avg: any) => avg.testId === test?.id
                  )?.average || 0;
                return (
                  <div className="flex flex-col" key={i}>
                    <div
                      onClick={() => {
                        setSelectedTest(test);
                        setCurrentData([]);
                        setPage(1);
                        setTotalPages(1);
                      }}
                      className={cn(
                        "flex flex-col gap-4 p-4 items-start cursor-pointer",
                        i === 0 ? "rounded-t-md" : "",
                        i === fetchTests?.data?.tests?.length - 1
                          ? "rounded-b-md"
                          : "",
                        selectedTest?.id === test.id
                          ? "dark:bg-black bg-white border-l-2 border-primary"
                          : ""
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm text-muted-foreground font-semibold capitalize",
                          selectedTest?.id === test.id ? "text-primary" : ""
                        )}
                      >
                        {test.name}
                      </p>
                      <ProgressCircle
                        color={getChartColor(average)}
                        value={average}
                        size="sm"
                      >
                        <span className="text-[0.6rem] text-primary font-bold">
                          {Math.round(average)}%
                        </span>
                      </ProgressCircle>
                    </div>
                    <Separator />
                  </div>
                );
              })}
            </div>
            <div className="bg-primary-foreground flex flex-col gap-12 border rounded-md w-full p-4 mb-24">
              <div className="flex flex-row">
                <div className="flex flex-col gap-3 items-start w-[25rem]">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold capitalize">
                      {selectedTest?.name} Evaluation
                    </h1>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Test ID: {selectedTest?.id}
                    </span>
                  </div>
                  <ProgressCircle
                    color={getChartColor(testAverage)}
                    value={testAverage}
                    size="md"
                  >
                    <span className="text-sm text-primary font-bold">
                      {Math.round(testAverage)}%
                    </span>
                  </ProgressCircle>
                  <p className="text-sm text-muted-foreground">
                    {selectedTest?.description}
                  </p>
                </div>
                {selectedTest && (
                  <EvalChart projectId={projectId} test={selectedTest} />
                )}
              </div>
              {selectedTest && (
                <EvaluationTable
                  projectId={projectId}
                  test={selectedTest}
                  selectedData={selectedData}
                  setSelectedData={setSelectedData}
                  currentData={currentData}
                  setCurrentData={setCurrentData}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  setTotalPages={setTotalPages}
                />
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-row gap-4 absolute top-[14rem] w-full md:px-24 px-12">
        <div className="bg-primary-foreground flex flex-col gap-0 border rounded-md w-[12rem] h-fit">
          {Array.from({ length: 5 }).map((_, i) => {
            return (
              <div className="flex flex-col" key={i}>
                <div
                  className={cn(
                    "flex flex-col gap-4 p-4 items-start cursor-pointer",
                    i === 0 ? "rounded-t-md" : "",
                    i === 4 ? "rounded-b-md" : ""
                  )}
                >
                  <p
                    className={cn(
                      "text-sm text-muted-foreground font-semibold capitalize",
                      i === 0 ? "text-primary" : ""
                    )}
                  >
                    <Skeleton className="w-20 h-6" />
                  </p>
                  <span className="text-[0.6rem] text-primary font-bold">
                    <Skeleton className="w-20 h-6" />
                  </span>
                </div>
                <Separator />
              </div>
            );
          })}
        </div>
        <div className="bg-primary-foreground flex flex-col gap-12 border rounded-md w-full p-4 mb-24">
          <div className="flex flex-row">
            <div className="flex flex-col gap-3 items-start w-[25rem]">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold capitalize">
                  <Skeleton className="w-20 h-6" />
                </h1>
                <span className="text-xs font-semibold text-muted-foreground">
                  <Skeleton className="w-20 h-6" />
                </span>
              </div>
              <span className="text-sm text-primary font-bold">
                <Skeleton className="w-20 h-6" />
              </span>
              <p className="text-sm text-muted-foreground">
                <Skeleton className="w-20 h-6" />
              </p>
            </div>
            <LargeChartSkeleton />
          </div>
          <EvaluationTableSkeleton />
        </div>
      </div>
    </div>
  );
}
