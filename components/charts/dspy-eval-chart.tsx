"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import LargeChartSkeleton from "./large-chart-skeleton";

export interface DspyEvalChartData {
  timestamp: string;
  score: number;
  runId: string;
}

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
  runId: {
    label: "Run ID",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DspyEvalChart({
  data,
  isLoading,
}: {
  data: DspyEvalChartData[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <LargeChartSkeleton />;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluated scores across runs</CardTitle>
      </CardHeader>
      <CardContent className="w-full overflow-auto">
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey="score"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
              domain={[0, 100]}
            />
            <XAxis
              dataKey="timestamp"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
            />
            <ChartTooltip cursor={true} content={<ChartTooltipContent />} />
            <Line
              dataKey="score"
              type="natural"
              stroke="var(--color-score)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-score)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
