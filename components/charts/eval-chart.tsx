"use client";

import { formatDurationForDisplay } from "@/lib/utils";
import { Test } from "@prisma/client";
// import { AreaChart } from "@tremor/react";
import { AreaChart } from "@tremor/react";
import { useState } from "react";
import { useQuery } from "react-query";
import DayFilter, { timeRanges } from "../shared/day-filter";
import { Info } from "../shared/info";
import LargeChartLoading from "./large-chart-skeleton";

const data = [
  {
    testId: "clx2ua1ag002xpctlwyupmoaz",
    overall: 100,
    perday: [
      {
        date: "2024-05-22",
        score: 100,
      },
      {
        date: "2024-05-21",
        score: 100,
      },
    ],
  },
  {
    testId: "clx2ua1ag112xpctlwyupmoaz",
    overall: 50,
    perday: [
      {
        date: "2024-05-22",
        score: 50,
      },
      {
        date: "2024-05-18",
        score: 50,
      },
    ],
  },
];

export function EvalChart({
  projectId,
  tests,
  chartDescription = "Evaluated Average(%) over time (last 7 days) for LLM interactions aggregated by day.",
  info = "Average is calculated based on the score of evaluated llm interactions in the Evaluation tab of the project. Span's start_time is used for day aggregation.",
}: {
  projectId: string;
  tests: Test[];
  chartDescription?: string;
  info?: string;
}) {
  const [lastNHours, setLastNHours] = useState(timeRanges[0].value);

  const { data: chartData, isLoading } = useQuery({
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

  if (isLoading || !chartData) {
    return <LargeChartLoading />;
  } else {
    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-full">
          <DayFilter lastNHours={lastNHours} setLastNHours={setLastNHours} />
          <div className="flex flex-row gap-3 h-12 font-semibold">
            <p className="text-sm text-start text-muted-foreground flex gap-1 items-center">
              {chartDescription}
              <Info information={info} />
            </p>
          </div>
          <AreaChart
            className="mt-2 h-72"
            data={chartData}
            index="date"
            categories={tests.map((test) => `${test.id}-${test.name}`)}
            colors={["purple", "blue", "red", "green", "orange", "black"]}
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
