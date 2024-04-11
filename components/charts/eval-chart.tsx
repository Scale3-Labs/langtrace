"use client";

import { Test } from "@prisma/client";
import { AreaChart } from "@tremor/react";
import { useQuery } from "react-query";
import { Info } from "../shared/info";
import LargeChartLoading from "../shared/large-chart-loading";

export function EvalChart({
  projectId,
  test,
  chartDescription = "Evaluated Average(%) over time (last 7 days) for LLM interactions aggregated by day.",
  info = "Average is calculated based on the score of evaluated llm interactions in the Evaluation tab of the project. Span's start_time is used for day aggregation.",
}: {
  projectId: string;
  test: Test;
  chartDescription?: string;
  info?: string;
}) {
  const fetchAccuracy = useQuery({
    queryKey: [`fetch-accuracy-${projectId}-${test.id}-query`],
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
    // aggregate accuracy per day and return the data
    const evaluations = fetchAccuracy?.data?.evaluations;
    const accuracyPerDay = evaluations.reduce((acc: any, evaluation: any) => {
      const date = evaluation.spanStartTime.split("T")[0];
      if (acc[date]) {
        acc[date].push(evaluation.score);
      } else {
        acc[date] = [evaluation.score];
      }
      return acc;
    }, {});

    // calculate accuracy by dividing the sum of scores that are only 1s by the number of evaluations times 100
    const data = Object.keys(accuracyPerDay).map((date) => {
      const scores = accuracyPerDay[date];

      // count +1s and -1s
      const totalPositive = scores.reduce((acc: number, score: number) => {
        if (score === 1) {
          return acc + 1;
        }
        return acc;
      }, 0);

      const totalNegative = scores.reduce((acc: number, score: number) => {
        if (score === -1) {
          return acc + 1;
        }
        return acc;
      }, 0);

      // calculate accuracy
      const accuracy = (totalPositive / (totalPositive + totalNegative)) * 100;

      return {
        date,
        "Evaluated Accuracy(%)": accuracy,
      };
    });

    // sort the data by date
    data.sort((a: any, b: any) => {
      return (new Date(a.date) as any) - (new Date(b.date) as any);
    });

    // calculate the overall accuracy
    const overallAccuracy = fetchAccuracy?.data?.average;

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
            data={data}
            index="date"
            categories={["Evaluated Accuracy(%)"]}
            colors={["purple"]}
            showAnimation={true}
            showTooltip={true}
            yAxisWidth={33}
            noDataText="Get started by sending traces to your project."
          />
          <p className="text-sm text-center text-muted-foreground">
            Evaulated Accuracy(%) over time (last 7 days)
          </p>
        </div>
      </>
    );
  }
}
