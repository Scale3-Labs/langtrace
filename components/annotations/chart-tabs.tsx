import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Test } from "@prisma/client";
import { ProgressCircle } from "@tremor/react";
import { useState } from "react";
import { useQuery } from "react-query";
import { EvalChart } from "../charts/eval-chart";
import { timeRanges } from "../shared/day-filter";

export function ChartTabs({
  projectId,
  tests,
}: {
  projectId: string;
  tests: Test[];
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
    return <div>Loading</div>;
  } else {
    return (
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metrics">Overall Metrics</TabsTrigger>
          <TabsTrigger value="score">Total Score</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics">
          <EvalChart projectId={projectId} tests={tests} />
        </TabsContent>
        <TabsContent value="score" className="p-3">
          {Object.keys(chartData?.scores).length > 0 ? (
            <div className="flex flex-row gap-4 flex-wrap">
              {Object.keys(chartData?.scores).map(
                (testId: string, index: number) => {
                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-2 items-center"
                    >
                      <ProgressCircle
                        value={(chartData?.scores[testId] || 0) * 100}
                        radius={45}
                        strokeWidth={6}
                        tooltip="radius: 25, strokeWidth: 6"
                      >
                        <span className="text-xs font-medium text-primary">
                          {(chartData?.scores[testId] || 0) * 100}%
                        </span>
                      </ProgressCircle>
                      <span className="text-sm font-semibold capitalize">
                        {tests.find((test) => testId.includes(test.id))?.name}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-semibold">No data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  }
}
