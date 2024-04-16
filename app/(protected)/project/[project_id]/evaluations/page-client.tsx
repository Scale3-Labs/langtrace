"use client";

import { EvalChart } from "@/components/charts/eval-chart";
import LargeChartSkeleton from "@/components/charts/large-chart-skeleton";
import { CreateTest } from "@/components/evaluations/create-test";
import { EditTest } from "@/components/evaluations/edit-test";
import { EvalDialog } from "@/components/evaluations/eval-dialog";
import EvaluationTable, {
  EvaluationTableSkeleton,
} from "@/components/evaluations/evaluation-table";
import { AddtoDataset } from "@/components/shared/add-to-dataset";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getChartColor } from "@/lib/utils";
import { Test } from "@prisma/client";
import { ProgressCircle } from "@tremor/react";
import { RabbitIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

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

  const { data: testAverages, isLoading: testAveragesLoading } = useQuery({
    queryKey: [`fetch-test-averages-${projectId}-query`],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/tests?projectId=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        toast.error("Failed to fetch test averages", {
          description: error?.message || "Failed to fetch test averages",
        });
        return { averages: [] };
      }
      const result = await response.json();
      return result;
    },
    refetchOnWindowFocus: false,
  });

  const {
    data: tests,
    isLoading: testsLoading,
    error: testsError,
  } = useQuery({
    queryKey: [`fetch-tests-${projectId}-query`],
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
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      if (result?.tests?.length > 0) {
        setSelectedTest(result?.tests?.[0]);
      }

      return result;
    },
    refetchOnWindowFocus: false,
    enabled: !!testAverages,
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

  const testAverage =
    testAverages?.averages?.find((avg: any) => avg.testId === selectedTest?.id)
      ?.average || 0;

  return (
    <div className="w-full flex flex-col">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Evaluations</h1>
        <div className="flex gap-2">
          <EvalDialog />
          <CreateTest projectId={projectId} variant={"outline"} />
          {selectedTest && (
            <EditTest projectId={projectId} test={selectedTest as Test} />
          )}
        </div>
      </div>
      {testAveragesLoading || testsLoading || !tests ? (
        <PageSkeleton />
      ) : tests?.tests?.length > 0 ? (
        <div className="flex flex-row gap-4 absolute top-[14rem] w-full md:px-24 px-12">
          <div className="bg-primary-foreground flex flex-col gap-0 border rounded-md w-[12rem] h-fit">
            {tests?.tests?.map((test: Test, i: number) => {
              const average =
                testAverages?.averages?.find(
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
                      i === tests?.tests?.length - 1 ? "rounded-b-md" : "",
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
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-4 items-start w-[25rem]">
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-semibold capitalize break-normal">
                    {selectedTest?.name} Evaluation
                  </h1>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Test ID: {selectedTest?.id}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Evaluation Scale
                  </span>
                  <span className="text-sm text-primary">
                    {selectedTest?.min} to {selectedTest?.max} in steps of +
                    {selectedTest?.step}
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
            <div className="flex flex-col gap-2">
              <AddtoDataset
                projectId={projectId}
                selectedData={selectedData}
                className="w-fit self-end"
              />

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
                  <div
                    className={cn(
                      "text-sm text-muted-foreground font-semibold capitalize",
                      i === 0 ? "text-primary" : ""
                    )}
                  >
                    <Skeleton className="w-20 h-6" />
                  </div>
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
                <div className="text-xl font-semibold capitalize">
                  <Skeleton className="w-20 h-6" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  <Skeleton className="w-20 h-6" />
                </span>
              </div>
              <span className="text-sm text-primary font-bold">
                <Skeleton className="w-20 h-6" />
              </span>
              <div className="text-sm text-muted-foreground">
                <Skeleton className="w-20 h-6" />
              </div>
            </div>
            <LargeChartSkeleton />
          </div>
          <EvaluationTableSkeleton />
        </div>
      </div>
    </div>
  );
}
