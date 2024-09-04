"use client";

import { Test } from "@prisma/client";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { ChartTabs } from "../annotations/chart-tabs";
import {
  AverageCostInferenceChart,
  CountInferenceChart,
} from "../charts/inference-chart";
import LargeChartSkeleton from "../charts/large-chart-skeleton";
import { TraceLatencyChart } from "../charts/latency-chart";
import { CostChart, TokenChart } from "../charts/token-chart";
import { TraceSpanChart } from "../charts/trace-chart";
import DayFilter, { timeRanges } from "../shared/day-filter";
import { ModelCombobox } from "../shared/model-combobox";
import { UserCombobox } from "../shared/user-combobox";
import { Separator } from "../ui/separator";

export default function Metrics({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [lastNHours, setLastNHours] = useState(timeRanges[0].value);
  const [userId, setUserId] = useState("");
  const [model, setModel] = useState("");

  const {
    data: tests,
    isLoading: testsLoading,
    error: testsError,
  } = useQuery({
    queryKey: ["fetch-tests-query", project_id],
    queryFn: async () => {
      const response = await fetch(`/api/test?projectId=${project_id}`);
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

      return result.tests as Test[];
    },
    refetchOnWindowFocus: false,
    onError: (error) => {
      toast.error("Failed to fetch tests", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold pr-2">Usage</p>
        <Separator />
        <div className="flex flex-row gap-2 items-center">
          <DayFilter lastNHours={lastNHours} setLastNHours={setLastNHours} />
          <UserCombobox setSelectedUser={setUserId} selectedUser={userId} />
          <ModelCombobox selectedModel={model} setSelectedModel={setModel} />
        </div>
        <div className="flex flex-row flex-wrap items-center gap-3">
          <TokenChart
            userId={userId}
            model={model}
            projectId={project_id}
            lastNHours={lastNHours}
          />
          <CostChart
            userId={userId}
            model={model}
            projectId={project_id}
            lastNHours={lastNHours}
          />
          <TraceSpanChart
            userId={userId}
            model={model}
            projectId={project_id}
            lastNHours={lastNHours}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold pr-2">LLM Inference Metrics</p>
        <Separator />
        <div className="flex flex-row flex-wrap items-center gap-3">
          <CountInferenceChart
            userId={userId}
            model={model}
            projectId={project_id}
            lastNHours={lastNHours}
          />
          <AverageCostInferenceChart
            userId={userId}
            model={model}
            projectId={project_id}
            lastNHours={lastNHours}
          />
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <p className="text-lg font-semibold">Manual Evaluation Scores</p>
            <Link
              href={`/project/${project_id}/annotations`}
              className="flex flex-row cursor-pointer text-xs text-blue-600 underline items-center"
            >
              Jump to Annotations
              <ArrowTopRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <Separator />
          {testsLoading || testsError ? (
            <LargeChartSkeleton />
          ) : (
            <ChartTabs
              projectId={project_id}
              defaultTab="metrics"
              tests={tests as Test[]}
            />
          )}
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <p className="text-lg font-semibold">Latency</p>
          </div>
          <Separator />
          <TraceLatencyChart
            userId={userId}
            model={model}
            projectId={project_id}
            lastNHours={lastNHours}
          />
        </div>
      </div>
    </div>
  );
}
