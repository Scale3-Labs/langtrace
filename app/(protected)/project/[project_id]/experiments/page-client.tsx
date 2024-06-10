"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatDateTime } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import data from "./experiment_result";

export default function Experiments() {
  const router = useRouter();
  const projectId = useParams()?.project_id as string;
  const [comparisonRunIds, setComparisonRunIds] = useState<string[]>([]);
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Experiments</h1>
        <div className="flex gap-2">
          <Button>New Experiment</Button>
          <Button
            variant={"outline"}
            disabled={comparisonRunIds.length < 2}
            onClick={() => {
              // append comparisonRunIds to query params. & only from the second run id
              const query = comparisonRunIds
                .map((runId, i) => (i === 0 ? "" : "&") + "run_id=" + runId)
                .join("");
              router.push(`/project/${projectId}/experiments/compare?${query}`);
            }}
          >
            Compare
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-12 w-full px-12">
        <div className="overflow-y-scroll">
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
              {data.map((experiment) => (
                <tr
                  key={experiment.eval.task_id}
                  className="hover:cursor-pointer hover:bg-muted"
                  onClick={() =>
                    router.push(
                      `/project/${projectId}/experiments/${experiment.eval.run_id}`
                    )
                  }
                >
                  <td
                    className="px-2 py-1 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      onCheckedChange={(value) => {
                        if (value) {
                          setComparisonRunIds([
                            ...comparisonRunIds,
                            experiment.eval.run_id,
                          ]);
                        } else {
                          setComparisonRunIds(
                            comparisonRunIds.filter(
                              (id) => id !== experiment.eval.run_id
                            )
                          );
                        }
                      }}
                    />
                  </td>
                  <td className="text-sm px-2 py-1">
                    {experiment.eval.run_id}
                  </td>
                  <td className="text-sm px-2 py-1">
                    {formatDateTime(experiment.stats.started_at, true)}
                  </td>
                  <td className="text-sm px-2 py-1">
                    {formatDateTime(experiment.stats.completed_at, true)}
                  </td>
                  <td className="text-sm px-2 py-1">{experiment.eval.task}</td>
                  <td className="text-sm px-2 py-1">
                    {experiment.samples?.length || 0}
                  </td>
                  <td className="text-sm px-2 py-1">{experiment.eval.model}</td>
                  <td className="text-sm px-2 py-1">{experiment.plan.name}</td>
                  <td className="text-sm px-2 py-1">
                    {experiment.results?.scorer?.name || "N/A"}
                  </td>
                  <td className="text-sm px-2 py-1 flex flex-wrap gap-2 w-72">
                    {Object.keys(experiment.results?.metrics).map(
                      (metric, i) => (
                        <Badge variant={"outline"} className="" key={i}>
                          {metric +
                            ": " +
                            (experiment.results.metrics as any)[
                              metric
                            ].value.toFixed(2)}
                        </Badge>
                      )
                    )}
                  </td>
                  <td
                    className={cn(
                      "text-sm px-2 py-1 font-semibold",
                      experiment.status === "success"
                        ? "text-green-600"
                        : "text-destructive"
                    )}
                  >
                    {experiment.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
