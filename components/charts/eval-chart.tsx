"use client";

import { formatDurationForDisplay } from "@/lib/utils";
import { Test } from "@prisma/client";
import { AreaChart } from "@tremor/react";
import { useQuery } from "react-query";
import { Info } from "../shared/info";
import LargeChartLoading from "./large-chart-skeleton";

export function EvalChart({
  projectId,
  test,
  lastNHours = 168,
  chartDescription = "Evaluated Average(%) over time (last 7 days) for LLM interactions aggregated by day.",
  info = "Average is calculated based on the score of evaluated llm interactions in the Evaluation tab of the project. Span's start_time is used for day aggregation.",
}: {
  projectId: string;
  test: Test;
  lastNHours?: number;
  chartDescription?: string;
  info?: string;
}) {
  const fetchAccuracy = useQuery({
    queryKey: [`fetch-accuracy-${projectId}-${test.id}-${lastNHours}-query`],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/accuracy?projectId=${projectId}&testId=${test.id}`
      );
      const result = await response.json();
      return result;
    },
  });

  if (fetchAccuracy.isLoading || !fetchAccuracy.data) {
    return <LargeChartLoading />;
  } else {
    const data: Array<Record<string, number>> =
      fetchAccuracy?.data?.accuracyPerDay;
    const overallAccuracy: number = fetchAccuracy?.data?.overallAccuracy;

    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-full">
          <div className="flex flex-row gap-3 h-12 font-semibold">
            <p className="text-sm text-start text-muted-foreground flex gap-1 items-center">
              {chartDescription}
              <Info information={info} />
            </p>
          </div>
          <p className="text-sm text-start font-semibold underline">
            Overall Accuracy: {overallAccuracy?.toFixed(2)}%
          </p>
          <AreaChart
            className="mt-2 h-72"
            data={data.map((dat) => ({
              date: dat.date,
              "Evaluated Accuracy(%)": dat.accuracy,
            }))}
            index="date"
            categories={["Evaluated Accuracy(%)"]}
            colors={["purple"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Evaulated Accuracy(%) over time{" "}
            {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}
