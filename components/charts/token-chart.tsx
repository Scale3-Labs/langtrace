"use client";

import { BarChart } from "@tremor/react";
import { useQuery } from "react-query";
import SmallChartLoading from "./small-chart-loading";

export function TokenChart({ projectId }: { projectId: string }) {
  const fetchMetricsUsageToken = useQuery({
    queryKey: ["fetch-metrics-usage-token-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/token?projectId=${projectId}`
      );
      const result = await response.json();
      return result;
    },
  });

  if (fetchMetricsUsageToken.isLoading || !fetchMetricsUsageToken.data) {
    return <SmallChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
          <div className="flex flex-row gap-4 h-12">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-start">
                Total Input Tokens:{" "}
                {fetchMetricsUsageToken.data.totalInputTokens || 0}
              </p>
              <p className="text-sm font-semibold text-start">
                Total Output Tokens:{" "}
                {fetchMetricsUsageToken.data.totalOutputTokens || 0}
              </p>
            </div>
            <p className="text-sm font-semibold text-start">
              Total Tokens: {fetchMetricsUsageToken.data.totalTokens || 0}
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={fetchMetricsUsageToken.data?.usage?.map((data: any) => ({
              date: data.date,
              "Total Tokens": parseInt(data.totalTokens),
              "Input Tokens": parseInt(data.inputTokens),
              "Output Tokens": parseInt(data.outputTokens),
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
            Total tokens over time (last 7 days)
          </p>
        </div>
      </>
    );
  }
}

export function CostChart({ projectId }: { projectId: string }) {
  const fetchMetricsUsageCost = useQuery({
    queryKey: ["fetch-metrics-usage-cost-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/cost?projectId=${projectId}`
      );
      const result = await response.json();
      return result;
    },
  });

  if (fetchMetricsUsageCost.isLoading || !fetchMetricsUsageCost.data) {
    return <SmallChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
          <div className="flex flex-row gap-4 h-12">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-start">
                Input Tokens Cost: $
                {fetchMetricsUsageCost.data?.input?.toFixed(6) || 0}
              </p>
              <p className="text-sm font-semibold text-start">
                Output Tokens Cost: $
                {fetchMetricsUsageCost.data?.output?.toFixed(6) || 0}
              </p>
            </div>
            <p className="text-sm font-semibold text-start">
              Total Cost: ${fetchMetricsUsageCost.data?.total?.toFixed(6) || 0}
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={fetchMetricsUsageCost.data?.cost?.map((data: any) => ({
              date: data?.date,
              "Total Cost": data?.total?.toFixed(6),
              "Input Tokens Cost": data?.input?.toFixed(6),
              "Output Tokens Cost": data?.output?.toFixed(6),
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
            Total cost over time (last 7 days)
          </p>
        </div>
      </>
    );
  }
}
