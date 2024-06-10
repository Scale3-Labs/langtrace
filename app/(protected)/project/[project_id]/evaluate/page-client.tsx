"use client";

import { EvalChart } from "@/components/charts/eval-chart";
import LargeChartSkeleton from "@/components/charts/large-chart-skeleton";
import { CreateTest } from "@/components/evaluate/create-test";
import { EditTest } from "@/components/evaluate/edit-test";
import EvaluationTable, {
  EvaluationTableSkeleton,
} from "@/components/evaluate/evaluation-table";
import { AddtoDataset } from "@/components/shared/add-to-dataset";
import { Button } from "@/components/ui/button";
import { Test } from "@prisma/client";
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
  const [selectedData, setSelectedData] = useState<CheckedData[]>([]);
  const [currentData, setCurrentData] = useState<any>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

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

      return result;
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
        <h1 className="text-3xl font-semibold">Evaluations</h1>
        <div className="flex gap-2">
          <CreateTest projectId={projectId} variant={"outline"} />
          {tests?.tests?.length > 0 && (
            <EditTest projectId={projectId} tests={tests?.tests} />
          )}
        </div>
      </div>
      {testsLoading || !tests ? (
        <PageSkeleton />
      ) : tests?.tests?.length > 0 ? (
        <div className="flex flex-col gap-12 top-[16rem] w-full md:px-24 px-12 mb-24">
          <EvalChart projectId={projectId} tests={tests.tests} />
          <div className="flex flex-col gap-2">
            <AddtoDataset
              projectId={projectId}
              selectedData={selectedData}
              className="w-fit self-end"
            />
            <EvaluationTable
              tests={tests.tests}
              projectId={projectId}
              selectedData={selectedData}
              setSelectedData={setSelectedData}
              currentData={currentData}
              setCurrentData={setCurrentData}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              setTotalPages={setTotalPages}
            />
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
      <div className="flex flex-col gap-12 top-[16rem] w-full md:px-24 px-12 mb-24">
        <LargeChartSkeleton />
        <div className="flex flex-col gap-2">
          <Button variant="outline" disabled={true} />
        </div>
        <EvaluationTableSkeleton />
      </div>
    </div>
  );
}
