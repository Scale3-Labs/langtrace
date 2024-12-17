"use client";

import { TestScore } from "@/components/human-evaluations/charts/test-score";
import { CreateTest } from "@/components/human-evaluations/create-test";
import { EditTest } from "@/components/human-evaluations/edit-test";
import { TableSkeleton } from "@/components/project/traces/table-skeleton";
import { Test } from "@prisma/client";
import { RabbitIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Annotations() {
  const projectId = useParams()?.project_id as string;

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
      <div className="px-10 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Human Evaluation Metrics</h1>
        <div className="flex gap-2">
          <CreateTest projectId={projectId} variant={"outline"} />
          {tests && tests?.length > 0 && (
            <EditTest projectId={projectId} tests={tests} />
          )}
        </div>
      </div>
      {testsLoading || !tests ? (
        <div className="flex flex-col gap-6 top-[16rem] w-full px-6 mb-24">
          <TableSkeleton />
        </div>
      ) : tests?.length > 0 ? (
        <div className="flex flex-col gap-6 top-[16rem] w-full px-6 mb-24">
          <TestScore />
        </div>
      ) : (
        <div className="px-10 py-12 flex flex-col gap-2 items-center justify-center">
          <p className="text-sm text-muted-foreground font-semibold">
            Start evaluating your traces from the traces tab.
          </p>
        </div>
      )}
    </div>
  );
}
