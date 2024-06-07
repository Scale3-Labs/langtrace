"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { TraceLatencyChart } from "../charts/latency-chart";
import { CostChart, TokenChart } from "../charts/token-chart";
import { TraceSpanChart } from "../charts/trace-chart";
import DayFilter, { timeRanges } from "../shared/day-filter";
import { Separator } from "../ui/separator";

export default function Metrics({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [lastNHours, setLastNHours] = useState(timeRanges[0].value);

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center">
          <p className="text-lg font-semibold pr-2">Usage</p>
          <DayFilter lastNHours={lastNHours} setLastNHours={setLastNHours} />
        </div>
        <Separator />
        <div className="flex flex-row items-center gap-5">
          <TokenChart projectId={project_id} lastNHours={lastNHours} />
          <CostChart projectId={project_id} lastNHours={lastNHours} />
          <TraceSpanChart projectId={project_id} lastNHours={lastNHours} />
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <p className="text-lg font-semibold">Latency</p>
          </div>
          <Separator />
          <TraceLatencyChart projectId={project_id} lastNHours={lastNHours} />
        </div>
      </div>
    </div>
  );
}
