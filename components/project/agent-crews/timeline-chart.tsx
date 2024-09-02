import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CrewAITrace } from "@/lib/crewai_trace_util";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";

const chartConfig = {
  start_time: {
    label: "start time",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function TimelineChart({
  data,
  fetchOldTraces,
  fetchLatestTraces,
  fetching,
  setSelectedTrace,
  selectedTrace,
}: {
  data: CrewAITrace[];
  fetchOldTraces: () => void;
  fetchLatestTraces: () => void;
  fetching: boolean;
  setSelectedTrace: (trace: CrewAITrace) => void;
  selectedTrace: CrewAITrace | null;
}) {
  // reverse the data array
  const chartData = data;
  const barSize = 20;
  const barGap = 4;
  const groupGap = 20;
  const totalGroups = data.length;
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const width = totalGroups * (barSize + groupGap);
    setChartWidth(width);
  }, [totalGroups]);

  return (
    <Card className="flex items-center">
      <Button
        className="h-[230px] shadow-md"
        disabled={fetching}
        variant={"ghost"}
        onClick={fetchOldTraces}
      >
        {!fetching ? (
          <ChevronLeft size={16} />
        ) : (
          <CircularProgress className="text-primary-foreground" size={16} />
        )}
      </Button>
      <CardContent className="overflow-x-auto">
        <ChartContainer
          style={{ width: `${chartWidth}px` }}
          config={chartConfig}
          className="h-[200px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            barSize={barSize}
            barGap={barGap}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="formatted_start_time"
              tickLine={true}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(-8)}
              reversed
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="total_duration">
              {data.map((entry, index) => (
                <Cell
                  onClick={() => setSelectedTrace(entry)}
                  radius={4}
                  className={cn(
                    "hover:cursor-pointer hover:fill-orange-600",
                    selectedTrace?.id === entry.id
                      ? "fill-orange-600"
                      : "fill-blue-600"
                  )}
                  key={index}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <Button
        variant={"secondary"}
        className="h-[230px] shadow-md"
        disabled={fetching}
        onClick={fetchLatestTraces}
      >
        {!fetching ? (
          <ChevronRight size={16} />
        ) : (
          <CircularProgress className="text-primary-foreground" size={16} />
        )}
      </Button>
    </Card>
  );
}
