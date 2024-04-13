"use client";

import { BarChart } from "@tremor/react";
import { useQuery } from "react-query";
import SmallChartLoading from "./small-chart-skeleton";

export function TraceSpanChart({ projectId }: { projectId: string }) {
  const fetchMetricsUsageTrace = useQuery({
    queryKey: ["fetch-metrics-usage-trace-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/trace?projectId=${projectId}`
      );
      const result = await response.json();
      return result;
    },
  });

  const fetchMetricsUsageSpan = useQuery({
    queryKey: ["fetch-metrics-usage-span-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/span?projectId=${projectId}`
      );
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchMetricsUsageTrace.isLoading ||
    !fetchMetricsUsageTrace.data ||
    fetchMetricsUsageSpan.isLoading ||
    !fetchMetricsUsageSpan.data
  ) {
    return <SmallChartLoading />;
  } else {
    const traceData = fetchMetricsUsageTrace.data?.traces?.map((data: any) => ({
      date: data.date,
      "Trace Count": parseInt(data.traceCount),
    }));
    const spanData = fetchMetricsUsageSpan.data?.spans?.map((data: any) => ({
      date: data.date,
      "Span Count": parseInt(data.spanCount),
    }));

    const data = traceData?.map((trace: any, index: number) => {
      return {
        ...trace,
        "Span Count":
          spanData && spanData.length > 0 && spanData[index] !== undefined
            ? spanData[index]["Span Count"]
            : 0,
      };
    });

    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
          <div className="flex flex-col gap-1 h-12">
            <div className="flex flex-row gap-4 flex-wrap ">
              <p className="text-sm font-semibold text-start">
                Total Traces Ingested: {fetchMetricsUsageTrace.data.total || 0}
              </p>
              <p className="text-sm font-semibold text-start">
                Total Spans Ingested: {fetchMetricsUsageSpan.data.total || 0}
              </p>
            </div>
            <p className="text-xs text-start text-muted-foreground">
              Traces are a collection of spans that represent a single request.
              Spans are individual events that represent a single operation.
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={data}
            index="date"
            categories={["Trace Count", "Span Count"]}
            colors={["purple", "blue"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Total traces over time (last 7 days)
          </p>
        </div>
      </>
    );
  }
}

export function SpanChart({ projectId }: { projectId: string }) {
  const fetchMetricsUsageSpan = useQuery({
    queryKey: ["fetch-metrics-usage-span-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/span?projectId=${projectId}`
      );
      const result = await response.json();
      return result;
    },
  });

  if (fetchMetricsUsageSpan.isLoading || !fetchMetricsUsageSpan.data) {
    return <SmallChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-start">
              Total Spans Ingested: {fetchMetricsUsageSpan.data.total}
            </p>
            <p className="text-xs text-start text-muted-foreground">
              Spans are individual events that represent a single operation.
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={fetchMetricsUsageSpan.data.spans.map((data: any) => ({
              date: data.date,
              "Span Count": parseInt(data.spanCount),
            }))}
            index="date"
            categories={["Span Count"]}
            colors={["purple"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Total spans over time (last 7 days)
          </p>
        </div>
      </>
    );
  }
}
