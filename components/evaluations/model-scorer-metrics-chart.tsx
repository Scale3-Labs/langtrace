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

export default function ModelScorerMetricsChart({
  data,
  chartType,
}: {
  data: any;
  chartType: string;
}) {
  const chartData: any = [];
  for (let i = 0; i < Object.keys(data).length; i++) {
    const scorer = Object.keys(data)[i];
    for (const metric of data[scorer]) {
      const data = metric.scores || [];
      const config = {
        [metric.name]: {
          label: metric.name,
          color: `hsl(var(--chart-${i + 1}))`,
        },
      };
      chartData.push({
        scorer,
        data,
        config,
      });
    }
  }

  return (
    <>
      {chartData.map((d: any, i: number) => (
        <Card key={i}>
          <CardHeader className="items-center pb-4">
            <CardTitle>
              {`${d?.scorer} - ${Object.keys(d?.config)[0]}`}
            </CardTitle>
            <CardDescription>
              {`Model comparison for ${d?.scorer} - ${Object.keys(d?.config)[0]} (sum of scores)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartType === "radar" && (
              <ChartContainer config={d.config} className="w-[500px]">
                <RadarChart data={d.data}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <PolarAngleAxis dataKey="model" />
                  <PolarGrid />
                  <Radar
                    dataKey={Object.keys(d.config)[0]}
                    fill={`hsl(var(--chart-${i + 1}))`}
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
              <ChartContainer config={d.config} className="w-[500px]">
                <BarChart
                  accessibilityLayer
                  data={d.data}
                  margin={{
                    top: 20,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey={"model"}
                    fill={`hsl(var(--chart-${i + 1}))`}
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
                    dataKey={Object.keys(d.config)[0]}
                    fill={`hsl(var(--chart-${i + 1}))`}
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
      ))}
    </>
  );
}
