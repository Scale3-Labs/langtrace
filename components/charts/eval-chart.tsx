"use client";

import { formatDurationForDisplay } from "@/lib/utils";
import { Test } from "@prisma/client";
// import { AreaChart } from "@tremor/react";
import { useQuery } from "react-query";
import { Info } from "../shared/info";
import LargeChartLoading from "./large-chart-skeleton";

export function EvalChart({
  projectId,
  tests,
  lastNHours = 10000,
  chartDescription = "Evaluated Average(%) over time (last 7 days) for LLM interactions aggregated by day.",
  info = "Average is calculated based on the score of evaluated llm interactions in the Evaluation tab of the project. Span's start_time is used for day aggregation.",
}: {
  projectId: string;
  tests: Test[];
  lastNHours?: number;
  chartDescription?: string;
  info?: string;
}) {
  const fetchScore = useQuery({
    queryKey: ["fetch-score", projectId, lastNHours],
    queryFn: async () => {
      const filters = [
        {
          key: "llm.prompts",
          operation: "NOT_EQUALS",
          value: "",
          type: "attribute",
        },
        {
          key: "status_code",
          operation: "EQUALS",
          value: "OK",
          type: "property",
        },
      ];
      const response = await fetch("/api/metrics/score", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          testIds: tests.map((test) => test.id),
          lastNHours,
          filters,
          filterOperation: "AND",
        }),
      });
      const result = await response.json();
      return result;
    },
  });

  if (fetchScore.isLoading || !fetchScore.data) {
    return <LargeChartLoading />;
  } else {
    const data: Array<Record<string, number>> =
      fetchScore?.data?.accuracyPerDay;
    const overallAccuracy: number = fetchScore?.data?.overallAccuracy;

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
          {/* <AreaChart
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
          /> */}
          <p className="text-sm text-center text-muted-foreground">
            Evaulated Accuracy(%) over time{" "}
            {formatDurationForDisplay(lastNHours)}
          </p>
        </div>
      </>
    );
  }
}
