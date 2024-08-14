"use client";

import { formatDurationForDisplay } from "@/lib/utils";
import { AreaChart, BarChart } from "@tremor/react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { Info } from "../shared/info";
import LargeChartLoading from "./large-chart-skeleton";
import SmallChartLoading from "./small-chart-skeleton";

export function CountInferenceChart({
  projectId,
  lastNHours = 168,
  userId,
  model,
}: {
  projectId: string;
  lastNHours?: number;
  userId?: string;
  model?: string;
}) {
  const {
    data: inferenceCount,
    isLoading: inferenceCountLoading,
    error: inferenceCountError,
  } = useQuery({
    queryKey: [
      "fetch-metrics-count-inference",
      projectId,
      lastNHours,
      userId,
      model,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/trace?projectId=${projectId}&lastNHours=${lastNHours}&userId=${userId}&model=${model}&inference=true`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch inference count");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch inference count", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (inferenceCountLoading || inferenceCountError) {
    return <SmallChartLoading />;
  } else {
    const inferenceData = inferenceCount?.traces?.map((data: any) => ({
      date: data.date || "",
      "Inference Count": parseInt(data?.traceCount) || 0,
    }));

    const data = inferenceData?.map((trace: any, index: number) => {
      return {
        ...trace,
      };
    });

    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-[55vh]">
          <div className="flex flex-col gap-1 h-12">
            <div className="flex flex-row gap-4 flex-wrap ">
              <p className="text-sm font-semibold text-start">
                Total LLM Inferences: {inferenceCount?.total || 0}
              </p>
            </div>
            <p className="text-xs text-start text-muted-foreground">
              Inferences are requests made to Large Language Models.
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={data}
            index="date"
            categories={["Inference Count"]}
            colors={["purple", "blue"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Total inferences over time {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}

export function AverageCostInferenceChart({
  projectId,
  lastNHours = 168,
  userId,
  model,
}: {
  projectId: string;
  lastNHours?: number;
  userId?: string;
  model?: string;
}) {
  const {
    data: costUsage,
    isLoading: costUsageLoading,
    error: costUsageError,
  } = useQuery({
    queryKey: [
      "fetch-metrics-inference-cost",
      projectId,
      lastNHours,
      userId,
      model,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/cost/inference?projectId=${projectId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error?.message || "Failed to fetch inference cost usage"
        );
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch inference cost usage", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (costUsageLoading || costUsageError) {
    return <SmallChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col justify-between h-[406px] border p-14 rounded-lg w-[55vh]">
          <div className="flex flex-col items-center">
            <p className="text-7xl text-center w-full">
              {costUsage?.count > 0 && costUsage?.cost > 0
                ? `$${(costUsage?.cost / costUsage?.count).toFixed(6)}`
                : "$0.00"}
            </p>
            <p className="text-md text-center w-full">Average Inference Cost</p>
            <p className="text-xs text-center w-full">
              Average cost per LLM call based on current LLM pricing.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-7xl text-center w-full">
              {costUsage?.cost > 0
                ? `$${costUsage?.cost?.toFixed(6)}`
                : "$0.00"}
            </p>
            <p className="text-md text-center w-full">Total Cost</p>
            <p className="text-xs text-center w-full">
              Total cost of all LLM calls based on input/output tokens and
              current LLM pricing.
            </p>
          </div>
        </div>
      </>
    );
  }
}

export function AverageResponseTimeInferenceChart({
  projectId,
  lastNHours = 168,
  userId,
  model,
}: {
  projectId: string;
  lastNHours?: number;
  userId?: string;
  model?: string;
}) {
  const {
    data: metricsLatencyAverageInferencePerDay,
    isLoading: metricsLatencyAverageInferencePerDayLoading,
    error: metricsLatencyAverageInferencePerDayError,
  } = useQuery({
    queryKey: [
      "fetch-metrics-latency-average-inference-per-day",
      projectId,
      lastNHours,
      userId,
      model,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/latency/trace?projectId=${projectId}&lastNHours=${lastNHours}&userId=${userId}&model=${model}&inference=true`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error?.message || "Failed to fetch inference latency data"
        );
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch inference latency data", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (
    metricsLatencyAverageInferencePerDayLoading ||
    metricsLatencyAverageInferencePerDayError
  ) {
    return <LargeChartLoading />;
  } else {
    const avgLatencyData =
      metricsLatencyAverageInferencePerDay?.averageLatencies?.map(
        (data: any, index: number) => ({
          date: data?.date || "",
          "Average Inference Latency(ms)": data?.averageLatency || 0,
        })
      );

    const p99LatencyData =
      metricsLatencyAverageInferencePerDay?.p99Latencies?.map(
        (data: any, index: number) => ({
          date: data?.date || "",
          "p99 Trace Latency(ms)": data?.p99Latency || 0,
        })
      );

    const p95LatencyData =
      metricsLatencyAverageInferencePerDay?.p95Latencies?.map(
        (data: any, index: number) => ({
          date: data?.date || "",
          "p95 Trace Latency(ms)": data?.p95Latency || 0,
        })
      );

    const countData =
      metricsLatencyAverageInferencePerDay?.totalTracesPerHour?.map(
        (data: any, index: number) => ({
          date: data?.date || "",
          "Trace Count": data?.traceCount || 0,
        })
      );

    const data = avgLatencyData?.map((avgLatency: any, index: number) => {
      return {
        ...avgLatency,
        "Inference Count": countData[index]["Trace Count"],
        "p99 Inference Latency(ms)":
          p99LatencyData[index]["p99 Trace Latency(ms)"],
        "p95 Inference Latency(ms)":
          p95LatencyData[index]["p95 Trace Latency(ms)"],
      };
    });

    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg">
          <div className="flex flex-row gap-4 h-12 font-semibold">
            <p className="text-sm text-start text-muted-foreground flex gap-1 items-center">
              p99 Latency{" "}
              <Info
                information="p99 latency represents the longest amount of time that 99
              out of every 100 requests take to complete."
              />
            </p>
            <p className="text-sm text-start text-muted-foreground flex gap-1 items-center">
              p95 Latency{" "}
              <Info
                information="p95 latency represents the longest amount of time that 95
              out of every 100 requests take to complete."
              />
            </p>
          </div>
          <AreaChart
            className="mt-2 h-72"
            data={data}
            index="date"
            categories={[
              "Average Inference Latency(ms)",
              "p99 Inference Latency(ms)",
              "p95 Inference Latency(ms)",
              "Inference Count",
            ]}
            colors={["purple", "blue", "green", "red"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            maxValue={15000}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Average inference latency per day(ms) for the{" "}
            {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}
