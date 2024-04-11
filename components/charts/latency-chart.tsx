"use client";

import { AreaChart } from "@tremor/react";
import { useQuery } from "react-query";
import { Info } from "../shared/info";
import LargeChartLoading from "../shared/large-chart-loading";

export function TraceLatencyChart({ projectId }: { projectId: string }) {
  const fetchMetricsLatencyAverageTracePerDay = useQuery({
    queryKey: ["fetch-metrics-latency-average-trace-per-day-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/latency/trace?projectId=${projectId}`
      );
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchMetricsLatencyAverageTracePerDay.isLoading ||
    !fetchMetricsLatencyAverageTracePerDay.data
  ) {
    return <LargeChartLoading />;
  } else {
    const avgLatencyData =
      fetchMetricsLatencyAverageTracePerDay.data?.averageLatencies?.map(
        (data: any, index: number) => ({
          date: data.date,
          "Average Trace Latency(ms)": data.averageLatency,
        })
      );

    const p99LatencyData =
      fetchMetricsLatencyAverageTracePerDay.data?.p99Latencies?.map(
        (data: any, index: number) => ({
          date: data.date,
          "p99 Trace Latency(ms)": data.p99Latency,
        })
      );

    const p95LatencyData =
      fetchMetricsLatencyAverageTracePerDay.data?.p95Latencies?.map(
        (data: any, index: number) => ({
          date: data.date,
          "p95 Trace Latency(ms)": data.p95Latency,
        })
      );

    const countData =
      fetchMetricsLatencyAverageTracePerDay.data?.totalTracesPerDay?.map(
        (data: any, index: number) => ({
          date: data.date,
          "Trace Count": data.traceCount,
        })
      );

    const data = avgLatencyData?.map((avgLatency: any, index: number) => {
      return {
        ...avgLatency,
        "Trace Count": countData[index]["Trace Count"],
        "p99 Trace Latency(ms)": p99LatencyData[index]["p99 Trace Latency(ms)"],
        "p95 Trace Latency(ms)": p95LatencyData[index]["p95 Trace Latency(ms)"],
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
              "Average Trace Latency(ms)",
              "p99 Trace Latency(ms)",
              "p95 Trace Latency(ms)",
              "Trace Count",
            ]}
            colors={["purple", "blue", "green", "red"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Average trace latency per day(ms) for the last 7 days
          </p>
        </div>
      </>
    );
  }
}
