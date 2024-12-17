"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChartIcon, TrendingDown, TrendingUp } from "lucide-react";
import { useParams } from "next/navigation";
import * as React from "react";
import { useQuery } from "react-query";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

export function MetricAverage({
  timeRange,
  entityType,
  metric = "average",
}: {
  timeRange: string;
  entityType: string;
  metric?: string;
}) {
  const projectId = useParams()?.project_id as string;
  const {
    data: chartData,
    isLoading: chartDataLoading,
    error: chartDataError,
  } = useQuery({
    queryKey: [
      "fetch-human-eval-average-query",
      projectId,
      entityType,
      timeRange,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/human-eval/average?projectId=${projectId}&type=${entityType}&lastXDays=${timeRange.split("d")[0]}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch tests");
      }
      const result = await response.json();
      return result;
    },
  });

  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});

  React.useEffect(() => {
    if (!chartData || chartData.length === 0) return;

    const newChartConfig = chartData.reduce(
      (config: any, metric: any, index: number) => {
        return {
          ...config,
          [metric.name]: {
            label: metric.name
              .replace(/-/g, " ")
              .replace(/\b\w/g, (char: string) => char.toUpperCase()),
            color: `hsl(var(--chart-${index + 1}))`,
          },
        };
      },
      {}
    );
    setChartConfig(newChartConfig);
  }, [chartData]);

  if (
    chartDataLoading ||
    chartDataError ||
    (chartData?.length > 0 &&
      (!chartConfig || Object.keys(chartConfig).length === 0))
  ) {
    return (
      <div className="flex flex-row gap-4 mt-12 flex-wrap">
        {[1, 2, 3, 4, 5, 6].map((key) => {
          return <Skeleton className="h-[360px] w-[340px]" key={key} />;
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm">
        {metric
          ?.replace(/-/g, " ")
          ?.replace(/\b\w/g, (char: string) => char?.toUpperCase())}{" "}
        scores of various metrics for the last {timeRange.split("d")[0]} days
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
          {chartData.map((item: any, index: number) => {
            const value =
              metric === "average"
                ? item.average
                : metric === "median"
                  ? item.median
                  : item.average;
            const color = chartConfig[item.name]?.color;
            const startAngle = 90;
            const endAngle = 90 - (360 * value) / 100;
            return (
              <Card key={index} className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>
                    {item.name
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (char: string) => char?.toUpperCase())}
                  </CardTitle>
                  <CardDescription>
                    {timeRange.split("d")[0]} days
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <RadialBarChart
                      data={[item]}
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
                      <RadialBar dataKey={metric} background fill={color} />
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
                                    {value.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    {metric}
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
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Trending{" "}
                    {item.average === item.median
                      ? "neutral"
                      : item.average > item.median
                        ? "up"
                        : "down"}{" "}
                    by {item.average - item.median}% this month{" "}
                    {item.average > item.median && (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    {item.average < item.median && (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing the {metric} score for the last{" "}
                    {timeRange.split("d")[0]} days
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
