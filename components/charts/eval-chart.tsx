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

export function EvalChart({
  projectId,
  tests,
  chartDescription = "Trend of test scores over the selected period of time",
  info = "Score is the sum total all the evaluated score for a test over the selected period of time.",
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
      const filters = {
        filters: [
          {
            operation: "OR",
            filters: [
              {
                key: "llm.prompts",
                operation: "NOT_EQUALS",
                value: "",
                type: "attribute",
              },
              {
                key: "name",
                operation: "EQUALS",
                value: "gen_ai.content.prompt",
                type: "event",
              },
            ],
          },
          {
            key: "status_code",
            operation: "EQUALS",
            value: "OK",
            type: "property",
          },
        ],
        operation: "AND",
      };
      const response = await fetch("/api/metrics/score", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          testIds: tests.map((test) => test.id),
          lastNHours,
          filters,
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
            <div className="text-sm text-start text-muted-foreground flex gap-1 items-center">
              {chartDescription}
              <Info information={info} />
            </div>
          </div>
          <AreaChart
            className="mt-2 h-72"
            data={chartData.metrics}
            index="date"
            categories={tests.map((test) => `${test.name}(${test.id})`)}
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
