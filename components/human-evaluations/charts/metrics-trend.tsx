"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChartIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "react-query";

export function MetricsTrend({
  timeRange,
  entityType,
}: {
  timeRange: string;
  entityType: string;
}) {
  const projectId = useParams()?.project_id as string;
  const [filteredData, setFilteredData] = React.useState([]);
  const {
    data: chartData,
    isLoading: chartDataLoading,
    error: chartDataError,
  } = useQuery({
    queryKey: ["fetch-human-eval-trend-query", projectId, entityType],
    queryFn: async () => {
      const response = await fetch(
        `/api/human-eval/trend?projectId=${projectId}&type=${entityType}`
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

  useEffect(() => {
    if (!chartData || chartData.length === 0) return;

    const testTypes = Object.keys(chartData[0]).filter((key) => key !== "date");

    const newChartConfig = testTypes.reduce((config, test, index) => {
      const key = test;
      return {
        ...config,
        [key]: {
          label: test
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          color: `hsl(var(--chart-${index + 1}))`,
        },
      };
    }, {});

    setChartConfig(newChartConfig);
  }, [chartData]);

  useEffect(() => {
    if (!chartData) return;

    const tmpData = chartData.filter((item: any) => {
      const date = new Date(item.date);
      const referenceDate = new Date();
      let daysToSubtract = 365;
      if (timeRange === "180d") {
        daysToSubtract = 180;
      } else if (timeRange === "90d") {
        daysToSubtract = 90;
      } else if (timeRange === "30d") {
        daysToSubtract = 30;
      } else if (timeRange === "14d") {
        daysToSubtract = 14;
      } else if (timeRange === "7d") {
        daysToSubtract = 7;
      }
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    });

    setFilteredData(tmpData);
  }, [chartData, timeRange]);

  if (chartDataLoading || chartDataError) {
    return <Skeleton className="h-[380px] w-full" />;
  }

  return (
    <div className="flex flex-col gap-4 mt-8">
      <h2 className="text-sm">
        Trend of total(sum) scores of various metrics for the last{" "}
        {timeRange.split("d")[0]} days
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
        <Card>
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1 text-center sm:text-left">
              <CardTitle>Metrics Trend</CardTitle>
              <CardDescription className="w-3/4">
                Showing the average trend of the metrics evaluated. Each data
                point represents the average of all scores for that day. For
                example, if a date has 3 evaluations with scores -1, 1, and 1 on
                a scale with min = -1 and max = 1, the average score is
                normalized on a 0-100 scale and calculated as 66.67%.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-quality)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-factual-accuracy)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-quality)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-factual-accuracy)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                {Object.keys(chartConfig).map((key, index) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="natural"
                    fill={`url(#fill${index})`}
                    stroke={`var(--color-${key})`}
                    stackId="a"
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
