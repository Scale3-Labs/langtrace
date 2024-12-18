"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChartIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { PolarGrid, RadialBar, RadialBarChart } from "recharts";

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
      // add a new key called "other" with value 100 for each item in the result
      result.forEach((item: any) => {
        item.push({
          stat: "other",
          value: 100,
          fill: "var(--color-other)",
        });
      });
      return result;
    },
  });

  const chartConfig = {
    value: {
      label: "Value",
    },
    average: {
      label: "Average",
      color: "hsl(var(--chart-1))",
    },
    median: {
      label: "Median",
      color: "hsl(var(--chart-2))",
    },
  } as ChartConfig;

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
            let average = 0;
            let median = 0;
            // Simplify the data preparation
            item.forEach((dataPoint: any) => {
              dataPoint.fill = `var(--color-${dataPoint["stat"]})`;
              if (dataPoint["stat"] === "average") {
                average = dataPoint["value"];
              } else if (dataPoint["stat"] === "median") {
                median = dataPoint["value"];
              }
            });
            const difference = average - median;

            return (
              <Card className="flex flex-col" key={index}>
                <CardHeader className="items-center pb-0">
                  <CardTitle>
                    {item[0]?.metric
                      ?.replace(/-/g, " ")
                      ?.replace(/\b\w/g, (char: string) => char?.toUpperCase())}
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
                      data={item}
                      innerRadius={75}
                      outerRadius={150}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent hideLabel nameKey="stat" />
                        }
                      />

                      <PolarGrid gridType="circle" />
                      <RadialBar dataKey="value" />
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x="50%"
                          y="50%"
                          className="fill-foreground text-4xl font-bold"
                        >
                          {average.toLocaleString()}%
                        </tspan>
                        <tspan
                          x="50%"
                          y="60%"
                          className="fill-muted-foreground"
                        >
                          Average
                        </tspan>
                      </text>
                    </RadialBarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <p className="text-sm text-muted-foreground w-[350px]">
                    The Average score is {average}. The Median score is {median}
                    .
                    {difference === 0
                      ? " The Average score is equal to the Median score which means the distribution is symmetric."
                      : difference > 0
                        ? "The Average score is higher than the Median score which means the distribution is skewed to the right implying there are outliers with higher scores."
                        : "The Average score is lower than the Median score which means the distribution is skewed to the left implying there are outliers with lower scores."}
                  </p>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
