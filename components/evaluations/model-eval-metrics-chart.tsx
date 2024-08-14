"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
} from "recharts";

export default function ModelEvalMetricsChart({
  data,
  chartType,
}: {
  data: any;
  chartType: string;
}) {
  const samplesConfig = {
    samples: {
      label: "Samples",
      color: "hsl(var(--chart-3))",
    },
  };
  const runsConfig = {
    runs: {
      label: "Runs",
      color: "hsl(var(--chart-4))",
    },
  };
  return (
    <>
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle>Total Samples</CardTitle>
          <CardDescription className="text-xs w-96 text-center">
            Total number of samples used for evaluation per model. Samples can
            be counted multiple times if the same model is evaluated multiple
            times.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          {chartType === "radar" && (
            <ChartContainer config={samplesConfig} className="w-[500px]">
              <RadarChart data={data}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <PolarAngleAxis dataKey="model" />
                <PolarGrid />
                <Radar
                  dataKey={"samples"}
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          )}
          {chartType === "bar" && (
            <ChartContainer config={samplesConfig} className="w-[500px]">
              <BarChart
                accessibilityLayer
                data={data}
                margin={{
                  top: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={"model"}
                  fill={"hsl(var(--chart-3))"}
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar
                  dataKey={"samples"}
                  fill={"hsl(var(--chart-3))"}
                  radius={4}
                >
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle>Total Runs</CardTitle>
          <CardDescription className="text-xs w-96 text-center">
            Total number of evaluation runs per model
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          {chartType === "radar" && (
            <ChartContainer config={runsConfig} className="w-[500px]">
              <RadarChart data={data}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <PolarAngleAxis dataKey="model" />
                <PolarGrid />
                <Radar
                  dataKey={"runs"}
                  fill="hsl(var(--chart-4))"
                  fillOpacity={0.6}
                  dot={{
                    r: 4,
                    fillOpacity: 1,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          )}
          {chartType === "bar" && (
            <ChartContainer config={runsConfig} className="w-[500px]">
              <BarChart
                accessibilityLayer
                data={data}
                margin={{
                  top: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey={"model"}
                  fill={"hsl(var(--chart-4))"}
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey={"runs"} fill={"hsl(var(--chart-4))"} radius={4}>
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </>
  );
}
