"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChartIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

export function MetricConfidence({
  timeRange,
  entityType,
}: {
  timeRange: string;
  entityType: string;
}) {
  const projectId = useParams()?.project_id as string;
  const {
    data: chartData,
    isLoading: chartDataLoading,
    error: chartDataError,
  } = useQuery({
    queryKey: [
      "fetch-human-eval-confidence-query",
      projectId,
      entityType,
      timeRange,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/human-eval/confidence?projectId=${projectId}&type=${entityType}&lastXDays=${timeRange.split("d")[0]}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch tests");
      }
      const result = await response.json();
      return result;
    },
  });

  const [startAngle, setStartAngle] = useState(90);
  const [endAngle, setEndAngle] = useState(90);

  useEffect(() => {
    if (chartData) {
      setStartAngle(90 - (360 * chartData.confidence) / 100);
      setEndAngle(90);
    }
  }, [chartData]);

  const chartConfig = {
    confidence: {
      label: "Confidence",
      color: "hsl(var(--chart-1))",
    },
  };

  if (chartDataLoading || chartDataError) {
    return (
      <div className="flex flex-row gap-4 mt-12 flex-wrap">
        <Skeleton className="h-[360px] w-[500px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm">
        Confidence for the last {timeRange.split("d")[0]} days
      </h2>
      <Separator />
      {chartData.length === 0 ? (
        <div className="flex flex-row gap-2 flex-wrap items-center justify-center my-8">
          <PieChartIcon className="h-4 w-4" />
          <p className="text-lg">
            No evaluations found. Get started by evaluating your traces.
          </p>
        </div>
      ) : (
        <div className="flex flex-row gap-4 flex-wrap">
          <Card className="flex flex-col w-[500px]">
            <CardHeader className="items-center pb-0">
              <CardTitle>Confidence</CardTitle>
              <CardDescription className="text-center">
                The percentage of evaluations that were completed by a human
                evaluator for all traces of {entityType} type in the last{" "}
                {timeRange.split("d")[0]} days.
                <br />
                <pre className="text-xs mt-2">
                  = (evaluated {entityType} traces/total {entityType} traces) x
                  100
                </pre>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={[chartData]}
                  endAngle={endAngle}
                  startAngle={startAngle}
                  innerRadius={80}
                  outerRadius={140}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar
                    dataKey="confidence"
                    background
                    fill={chartConfig.confidence.color}
                  />
                  <PolarRadiusAxis
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-4xl font-bold"
                              >
                                {chartData.confidence.toLocaleString()}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Confidence
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="text-muted-foreground text-center">
                Tip: Evaluate more traces to increase the overall confidence. A
                target confidence of 50% or higher is recommended.
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
