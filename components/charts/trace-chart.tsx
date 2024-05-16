"use client";

import { formatDurationForDisplay } from "@/lib/utils";
import { BarChart } from "@tremor/react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import SmallChartLoading from "./small-chart-skeleton";

export function TraceSpanChart({
  projectId,
  lastNHours = 168,
}: {
  projectId: string;
  lastNHours?: number;
}) {
  const {
    data: traceUsage,
    isLoading: traceUsageLoading,
    error: traceUsageError,
  } = useQuery({
    queryKey: [`fetch-metrics-usage-trace-${projectId}-${lastNHours}-query`],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/trace?projectId=${projectId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch trace usage");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch trace usage", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const {
    data: spanUsage,
    isLoading: spanUsageLoading,
    error: spanUsageError,
  } = useQuery({
    queryKey: [`fetch-metrics-usage-span-${projectId}-${lastNHours}-query`],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/span?projectId=${projectId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch span usage");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch span usage", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (
    traceUsageLoading ||
    traceUsageError ||
    spanUsageLoading ||
    spanUsageError
  ) {
    return <SmallChartLoading />;
  } else {
    const traceData = traceUsage?.traces?.map((data: any) => ({
      date: data.date || "",
      "Trace Count": parseInt(data?.traceCount) || 0,
    }));
    const spanData = spanUsage?.spans?.map((data: any) => ({
      date: data.date || "",
      "Span Count": parseInt(data?.spanCount) || 0,
    }));

    const data = traceData?.map((trace: any, index: number) => {
      return {
        ...trace,
        "Span Count":
          spanData && spanData?.length > 0 && spanData[index] !== undefined
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
                Total Traces Ingested: {traceUsage?.total || 0}
              </p>
              <p className="text-sm font-semibold text-start">
                Total Spans Ingested: {spanUsage?.total || 0}
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
            Total traces over time {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}

export function SpanChart({
  projectId,
  lastNHours = 168,
}: {
  projectId: string;
  lastNHours?: number;
}) {
  const {
    data: spanUsage,
    isLoading: spanUsageLoading,
    error: spanUsageError,
  } = useQuery({
    queryKey: [`fetch-metrics-usage-span-${projectId}-${lastNHours}-query`],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/usage/span?projectId=${projectId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch span usage");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch span usage", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (spanUsageLoading || spanUsageError) {
    return <SmallChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-1/3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-start">
              Total Spans Ingested: {spanUsage?.total || 0}
            </p>
            <p className="text-xs text-start text-muted-foreground">
              Spans are individual events that represent a single operation.
            </p>
          </div>
          <BarChart
            className="mt-2 h-72"
            data={spanUsage?.spans?.map((data: any) => ({
              date: data.date || "",
              "Span Count": parseInt(data?.spanCount) || 0,
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
            Total spans over time {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}
