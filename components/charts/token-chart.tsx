"use client";

import { formatDurationForDisplay } from "@/lib/utils";
import { BarChart } from "@tremor/react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import SmallChartLoading from "./small-chart-skeleton";

export function TokenChart({
  projectId,
  lastNHours = 168,
}: {
  projectId: string;
  lastNHours?: number;
}) {
  const {
    data: tokenUsage,
    isLoading: tokenUsageLoading,
    error: tokenUsageError,
  } = useQuery({
    queryKey: [`fetch-metrics-usage-token-${projectId}-${lastNHours}-query`],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/token?projectId=${projectId}&lastNHours=${lastNHours}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch token usage");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch token usage", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (tokenUsageLoading || tokenUsageError) {
    return <SmallChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
          <div className="flex flex-row gap-4 h-12">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-start">
                Total Input Tokens: {tokenUsage?.totalInputTokens || 0}
              </p>
              <p className="text-sm font-semibold text-start">
                Total Output Tokens: {tokenUsage?.totalOutputTokens || 0}
              </p>
            </div>
            <p className="text-sm font-semibold text-start">
              Total Tokens: {tokenUsage?.totalTokens || 0}
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={tokenUsage?.usage?.map((data: any) => ({
              date: data?.date,
              "Total Tokens": parseInt(data?.totalTokens),
              "Input Tokens": parseInt(data?.inputTokens),
              "Output Tokens": parseInt(data?.outputTokens),
            }))}
            index="date"
            categories={["Total Tokens", "Input Tokens", "Output Tokens"]}
            colors={["purple", "blue", "green"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Total tokens over time {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}

export function CostChart({
  projectId,
  lastNHours = 168,
}: {
  projectId: string;
  lastNHours?: number;
}) {
  const {
    data: costUsage,
    isLoading: costUsageLoading,
    error: costUsageError,
  } = useQuery({
    queryKey: [`fetch-metrics-usage-cost-${projectId}-${lastNHours}-query`],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/cost?projectId=${projectId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch cost usage");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch cost usage", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (costUsageLoading || costUsageError) {
    return <SmallChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
          <div className="flex flex-row gap-4 h-12">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-start">
                Input Tokens Cost: ${costUsage?.input?.toFixed(6) || 0}
              </p>
              <p className="text-sm font-semibold text-start">
                Output Tokens Cost: ${costUsage?.output?.toFixed(6) || 0}
              </p>
            </div>
            <p className="text-sm font-semibold text-start">
              Total Cost: ${costUsage?.total?.toFixed(6) || 0}
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={costUsage?.cost?.map((data: any) => ({
              date: data?.date,
              "Total Cost": data?.total?.toFixed(6) || 0,
              "Input Tokens Cost": data?.input?.toFixed(6) || 0,
              "Output Tokens Cost": data?.output?.toFixed(6) || 0,
            }))}
            index="date"
            categories={[
              "Total Cost",
              "Input Tokens Cost",
              "Output Tokens Cost",
            ]}
            colors={["purple", "blue", "green"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Total cost over time {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}
