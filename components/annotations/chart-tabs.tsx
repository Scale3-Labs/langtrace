import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Test } from "@prisma/client";
import { ProgressCircle } from "@tremor/react";
import { useState } from "react";
import { useQuery } from "react-query";
import { EvalChart } from "../charts/eval-chart";
import { timeRanges } from "../shared/day-filter";
import { Skeleton } from "../ui/skeleton";

export function ChartTabs({
  projectId,
  tests,
  defaultTab = "score",
}: {
  projectId: string;
  tests: Test[];
  defaultTab?: "metrics" | "score";
}) {
  const [lastNHours, setLastNHours] = useState(
    timeRanges[timeRanges.length - 1].value
  );

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["fetch-score", projectId, lastNHours],
    queryFn: async () => {
      const filters = {
        filters: [
          {
            key: "name",
            operation: "EQUALS",
            value: "gen_ai.content.completion",
            type: "event",
          },
          {
            operation: "OR",
            filters: [
              {
                key: "status_code",
                operation: "EQUALS",
                value: "STATUS_CODE_OK",
                type: "property",
              },
              {
                key: "status_code",
                operation: "EQUALS",
                value: "1",
                type: "property",
              },
            ],
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

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="score">Total Score (%)</TabsTrigger>
        <TabsTrigger value="metrics">Trend (%)</TabsTrigger>
      </TabsList>
      <TabsContent value="metrics">
        <EvalChart
          tests={tests}
          lastNHours={lastNHours}
          setLastNHours={setLastNHours}
          isLoading={isLoading}
          chartData={chartData}
        />
      </TabsContent>
      <TabsContent value="score" className="p-3 h-96 rounded-md border">
        {isLoading && !chartData ? (
          <div className="flex flex-row gap-4 flex-wrap">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        ) : Object.keys(chartData?.scores).length > 0 ? (
          <div className="flex flex-row gap-6 flex-wrap">
            {Object.keys(chartData?.scores).map(
              (testId: string, index: number) => {
                const score = chartData?.scores[testId] || 0;
                const testName = tests.find((test) =>
                  testId.includes(test.id)
                )?.name;
                const color =
                  score < 50 ? "red" : score < 80 ? "orange" : "green";
                const bgColor = `bg-${color}-100`;
                return (
                  <div key={index} className="flex flex-col gap-2 items-center">
                    <ProgressCircle
                      value={score}
                      radius={45}
                      strokeWidth={6}
                      color={color}
                      tooltip={`overall ${testName} score %`}
                    >
                      <span
                        className={cn(
                          "text-lg font-semibold text-black rounded-full h-16 w-16 flex items-center justify-center",
                          bgColor
                        )}
                      >
                        {chartData?.scores[testId] || 0}%
                      </span>
                    </ProgressCircle>
                    <span className="text-lg text-center font-semibold capitalize text-wrap w-24">
                      {testName}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="relative">
            <p className="text-xl font-semibold absolute right-1/2 transform translate-x-1/2 top-1/2 translate-y-1/2 text-center bg-muted p-1 rounded-md shadow-md">
              Get Started and measure the baseline performance of your
              application.
            </p>
            <div className="flex flex-row gap-4 flex-wrap opacity-30">
              {["accuracy", "quality", "relevance"].map((testName, index) => {
                const score = Math.floor(Math.random() * 100);
                const color =
                  score < 50 ? "red" : score < 80 ? "orange" : "green";
                const bgColor = `bg-${color}-100`;
                return (
                  <div key={index} className="flex flex-col gap-2 items-center">
                    <ProgressCircle
                      value={score}
                      radius={45}
                      strokeWidth={6}
                      color={color}
                      tooltip={`overall ${testName} score %`}
                    >
                      <span
                        className={cn(
                          "text-lg font-semibold text-primary rounded-full h-16 w-16 flex items-center justify-center",
                          bgColor
                        )}
                      >
                        {score}%
                      </span>
                    </ProgressCircle>
                    <span className="text-lg font-semibold capitalize">
                      {testName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
