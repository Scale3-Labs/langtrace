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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "react-query";

export function TestScore() {
  const projectId = useParams()?.project_id as string;
  const [timeRange, setTimeRange] = React.useState("365d");
  const [filteredData, setFilteredData] = React.useState([]);
  const {
    data: chartData,
    isLoading: chartDataLoading,
    error: chartDataError,
  } = useQuery({
    queryKey: ["fetch-evals-chart-data-query", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/human-eval?projectId=${projectId}&type=llm`
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

    console.log(newChartConfig);

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
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Test Score</CardTitle>
          <CardDescription>Showing the score of the tests</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 12 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="365d" className="rounded-lg">
              Last 12 months
            </SelectItem>
            <SelectItem value="180d" className="rounded-lg">
              Last 6 months
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="14d" className="rounded-lg">
              Last 14 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
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
  );
}
