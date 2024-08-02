import { formatDurationForDisplay } from "@/lib/utils";
import { Test } from "@prisma/client";
import { AreaChart } from "@tremor/react";
import DayFilter from "../shared/day-filter";
import { Info } from "../shared/info";
import { Skeleton } from "../ui/skeleton";

export function EvalChart({
  tests,
  lastNHours,
  setLastNHours,
  isLoading,
  chartData,
  chartDescription = "Trend of test scores over the selected period of time",
  info = "Score is the sum total all the evaluated score for a test over the selected period of time.",
}: {
  tests: Test[];
  lastNHours: number;
  setLastNHours: (value: number) => void;
  chartData: any;
  isLoading: boolean;
  chartDescription?: string;
  info?: string;
}) {
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
        {!isLoading ? (
          chartData ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-semibold">No data available</p>
            </div>
          )
        ) : (
          <Skeleton className="h-72" />
        )}
        <p className="text-sm text-center text-muted-foreground">
          Evaulated Accuracy(%) over time {formatDurationForDisplay(lastNHours)}
        </p>
      </div>
    </>
  );
}
