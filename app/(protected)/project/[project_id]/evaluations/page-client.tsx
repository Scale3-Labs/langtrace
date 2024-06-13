"use client";

import { Spinner } from "@/components/shared/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDateTime } from "@/lib/utils";
import { Run } from "@prisma/client";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { FlaskConical } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Evaluations() {
  const router = useRouter();
  const projectId = useParams()?.project_id as string;
  const [comparisonRunIds, setComparisonRunIds] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentData, setCurrentData] = useState<any>([]);
  const [showLoader, setShowLoader] = useState(false);

  const scrollableDivRef = useBottomScrollListener(() => {
    if (fetchExperiments.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchExperiments.refetch();
    }
  });

  const fetchExperiments = useQuery({
    queryKey: ["fetch-experiments-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/run?projectId=${projectId}&page=${page}&pageSize=25`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch evaluations");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      const newData = data.runs || [];
      const metadata = data?.metadata || {};

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
            a.findIndex((t: any) => t.id === v.id) === i
        );
        setCurrentData(uniqueData);
      } else {
        setCurrentData(newData);
      }
      setShowLoader(false);
    },
    onError: (error) => {
      toast.error("Failed to fetch evaluations", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Evaluations</h1>
        <div className="flex gap-2">
          <Button
            variant={currentData.length > 0 ? "default" : "outline"}
            disabled={comparisonRunIds.length < 2}
            onClick={() => {
              // append comparisonRunIds to query params. & only from the second run id
              const query = comparisonRunIds
                .map((runId, i) => (i === 0 ? "" : "&") + "run_id=" + runId)
                .join("");
              router.push(`/project/${projectId}/evaluations/compare?${query}`);
            }}
          >
            Compare
          </Button>
          <Button variant={currentData.length > 0 ? "outline" : "default"}>
            New Evaluation
            <FlaskConical className="ml-1 h-4 w-4" />
            <ArrowTopRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
      {!fetchExperiments.isLoading && (
        <div className="flex flex-col gap-12 w-full px-12">
          {currentData.length === 0 && (
            <div className="flex flex-col items-center gap-2 mt-24">
              <p className="text-center text-md">
                {fetchExperiments.isError
                  ? "Something went wrong. Please try later."
                  : "No evaluations found. Get started by running your first evaluation."}
              </p>
              <Button>
                New Evaluation
                <FlaskConical className="ml-1 h-4 w-4" />
                <ArrowTopRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
          {currentData.length > 0 && (
            <div className="overflow-y-scroll" ref={scrollableDivRef as any}>
              <table className="table-auto overflow-x-scroll w-max border-separate border border-muted rounded-md mt-6">
                <thead className="bg-muted">
                  <tr>
                    <th className="w-12 rounded-md p-2">
                      <Checkbox disabled={true} />
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Run ID
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Started at
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Completed at
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">Task</th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Total Samples
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Model
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Plan Name
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Scorer
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Metrics
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((experiment: Run) => {
                    const log: any = JSON.parse(experiment.log as string);
                    return (
                      <tr
                        key={experiment.id}
                        className="hover:cursor-pointer hover:bg-muted"
                        onClick={() =>
                          router.push(
                            `/project/${projectId}/evaluations/${log?.eval?.run_id}`
                          )
                        }
                      >
                        <td
                          className="px-2 py-1 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            disabled={log?.status !== "success"}
                            onCheckedChange={(value) => {
                              if (value) {
                                setComparisonRunIds([
                                  ...comparisonRunIds,
                                  log?.eval?.run_id,
                                ]);
                              } else {
                                setComparisonRunIds(
                                  comparisonRunIds.filter(
                                    (id) => id !== log?.eval?.run_id
                                  )
                                );
                              }
                            }}
                          />
                        </td>
                        <td className="text-sm px-2 py-1">
                          {log?.eval?.run_id}
                        </td>
                        <td className="text-sm px-2 py-1">
                          {formatDateTime(log?.stats?.started_at, true)}
                        </td>
                        <td className="text-sm px-2 py-1">
                          {formatDateTime(log?.stats?.completed_at, true)}
                        </td>
                        <td className="text-sm px-2 py-1">{log?.eval?.task}</td>
                        <td className="text-sm px-2 py-1">
                          {log?.samples?.length || 0}
                        </td>
                        <td className="text-sm px-2 py-1">
                          {log?.eval?.model}
                        </td>
                        <td className="text-sm px-2 py-1">{log?.plan?.name}</td>
                        <td className="text-sm px-2 py-1">
                          {log?.results?.scorer?.name || "N/A"}
                        </td>
                        <td className="text-sm px-2 py-1 flex flex-wrap gap-2 w-72">
                          {log?.results?.metrics
                            ? Object.keys(log?.results?.metrics).map(
                                (metric, i) => (
                                  <Badge
                                    variant={"outline"}
                                    className=""
                                    key={i}
                                  >
                                    {metric +
                                      ": " +
                                      (log?.results?.metrics as any)[
                                        metric
                                      ].value.toFixed(2)}
                                  </Badge>
                                )
                              )
                            : "N/A"}
                        </td>
                        <td className="px-2 py-1">
                          <Badge
                            className={cn(
                              "capitalize",
                              log?.status === "success"
                                ? "text-green-600 bg-green-200 hover:bg-green-200"
                                : "text-destructive bg-red-200 hover:bg-red-200"
                            )}
                          >
                            {log?.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {showLoader && (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8 text-center" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {fetchExperiments.isLoading && (
        <div className="flex flex-col gap-12 w-full px-12">
          <table className="table-auto overflow-x-scroll w-max border-separate border border-muted rounded-md mt-6">
            <thead className="bg-muted">
              <tr>
                <th className="w-12 rounded-md p-2">
                  <Checkbox disabled={true} />
                </th>
                <th className="p-2 rounded-md text-sm font-medium">Run ID</th>
                <th className="p-2 rounded-md text-sm font-medium">
                  Started at
                </th>
                <th className="p-2 rounded-md text-sm font-medium">
                  Completed at
                </th>
                <th className="p-2 rounded-md text-sm font-medium">Task</th>
                <th className="p-2 rounded-md text-sm font-medium">
                  Total Samples
                </th>
                <th className="p-2 rounded-md text-sm font-medium">Model</th>
                <th className="p-2 rounded-md text-sm font-medium">
                  Plan Name
                </th>
                <th className="p-2 rounded-md text-sm font-medium">Scorer</th>
                <th className="p-2 rounded-md text-sm font-medium">Metrics</th>
                <th className="p-2 rounded-md text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((j) => (
                <tr key={j}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                    <td key={i}>
                      <Skeleton className="h-[20px] w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
