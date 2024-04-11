"use client";

import { Test } from "@prisma/client";
import { BarChart } from "@tremor/react";
import { useQuery } from "react-query";
import { Info } from "../shared/info";
import LargeChartLoading from "../shared/large-chart-loading";

export function ModelAccuracyChart({
  projectId,
  test,
}: {
  projectId: string;
  test: Test;
}) {
  const fetchAccuracy = useQuery({
    queryKey: [`fetch-accuracy-model-${projectId}-${test.id}-query`],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/accuracy?projectId=${projectId}&testId=${test.id}&by_model=true`
      );
      const result = await response.json();
      return result;
    },
  });

  if (fetchAccuracy.isLoading || !fetchAccuracy.data) {
    return <LargeChartLoading />;
  } else {
    // for each key aggregate accuracy per day and return the data
    const evaluations: any[] = fetchAccuracy?.data?.evaluations;
    const result = Object.entries(evaluations).map(([key, evaluations]) => {
      const accuracyPerDay: any = {};
      let totalCorrect = 0; // To calculate overall accuracy

      evaluations.forEach((evaluation: any) => {
        const date = evaluation.spanStartTime.split("T")[0];
        if (!accuracyPerDay[date]) {
          accuracyPerDay[date] = { correct: 0, total: 0 };
        }
        accuracyPerDay[date].total++;
        if (evaluation.score === 1) {
          accuracyPerDay[date].correct++;
          totalCorrect++;
        }
      });

      const data = Object.entries(accuracyPerDay)
        .map(([date, { correct, total }]: any) => ({
          date,
          [`${key} Evaluated Accuracy(%)`]: (correct / total) * 100,
        }))
        .sort((a, b) => (new Date(a.date) as any) - (new Date(b.date) as any));

      const overallAccuracy = (totalCorrect / evaluations.length) * 100 || 0;

      return {
        model: key,
        data,
        overallAccuracy,
      };
    });

    const finalData: any = {};
    result.forEach((model) => {
      model.data.forEach((entry: any) => {
        const { date } = entry;
        const accuracyKey = Object.keys(entry).find((key) =>
          key.includes("Evaluated Accuracy")
        );
        if (!finalData[date]) {
          finalData[date] = { date };
        }
        if (accuracyKey) {
          finalData[date][accuracyKey] = entry[accuracyKey];
        }
      });
    });

    const sortedArray = Object.values(finalData).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const colors = ["purple", "blue", "green", "red", "yellow", "orange"];

    return (
      <>
        <div className="flex flex-col gap-2 border p-3 rounded-lg w-full">
          <div className="flex flex-row gap-3 h-12 font-semibold">
            <p className="text-sm text-start text-muted-foreground flex gap-1 items-center">
              Evaluated Accuracy(%) over time (last 7 days) for LLM interactions
              aggregated by day.
              <Info information="Accuracy is calculated based on the score of evaluated llm interactions in the Eval tab of the project. Span's start_time is used for day aggregation." />
            </p>
          </div>
          {result.map((r, i) => (
            <p key={i} className="text-sm text-start font-semibold underline">
              {r.model} Overall Accuracy: {r.overallAccuracy?.toFixed(2)}%
            </p>
          ))}
          <BarChart
            className="mt-2 h-72"
            data={sortedArray}
            index="date"
            categories={
              result.map((r) => `${r.model} Evaluated Accuracy(%)`) || []
            }
            colors={result.map((r) => {
              // get a random color from the colors array
              const index = Math.floor(Math.random() * colors.length);
              const color = colors[index];
              return color;
            })}
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
