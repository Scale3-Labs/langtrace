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
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

export default function ModelMetricsChart({ data }: { data: any }) {
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
    <div className="flex gap-4 max-h-[500px] flex-wrap mb-12 w-full">
      {chartData.map((d: any, i: number) => (
        <Card key={i}>
          <CardHeader className="items-center pb-4">
            <CardTitle>
              {`${d?.scorer} - ${Object.keys(d?.config)[0]}`}
            </CardTitle>
            <CardDescription>
              {`Model comparison for ${d?.scorer} - ${Object.keys(d?.config)[0]}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
