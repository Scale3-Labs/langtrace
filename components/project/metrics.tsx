"use client";

import { useParams } from "next/navigation";
import { TraceLatencyChart } from "../charts/latency-chart";
import { CostChart, TokenChart } from "../charts/token-chart";
import { TraceSpanChart } from "../charts/trace-chart";
import { Separator } from "../ui/separator";

export default function Metrics({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold">Usage</p>
        {/* add dropdown for 12hrs, 1d, 3d, 5d, 7d, 30d and 60d */}
        {/* need to pass in parameter to the chart to change the time range */}
        <Separator />
        <div className="flex flex-row items-center gap-5">
          <TokenChart projectId={project_id} />
          <CostChart projectId={project_id} />
          <TraceSpanChart projectId={project_id} />
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <p className="text-lg font-semibold">Latency</p>
          </div>
          <Separator />
          <TraceLatencyChart projectId={project_id} />
        </div>
      </div>
    </div>
  );
}
