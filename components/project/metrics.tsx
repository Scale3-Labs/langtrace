"use client";

import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { AccuracyChart } from "../charts/accuracy-chart";
import { TraceLatencyChart } from "../charts/latency-chart";
import { ModelAccuracyChart } from "../charts/model-accuracy-chart";
import { CostChart, TokenChart } from "../charts/token-chart";
import { TraceSpanChart } from "../charts/trace-chart";
import { Info } from "../shared/info";
import { Separator } from "../ui/separator";

export default function Metrics({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;

  const fetchProject = useQuery({
    queryKey: ["fetch-project-query"],
    queryFn: async () => {
      const response = await fetch(`/api/project?id=${project_id}`);
      const result = await response.json();
      return result;
    },
  });

  const fetchUser = useQuery({
    queryKey: ["fetch-user-query"],
    queryFn: async () => {
      const response = await fetch(`/api/user?email=${email}`);
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchProject.isLoading ||
    !fetchProject.data ||
    fetchUser.isLoading ||
    !fetchUser.data
  ) {
    return <div>Loading...</div>;
  } else {
    return (
      <div className="w-full flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">Usage</p>
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
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <p className="text-lg font-semibold">Evaluated Accuracy</p>
            <Info information="This is calculated based on your evaluation of the q&a pairs. Go to the Eval tab to start evaluating to see this metric calculated." />
          </div>
          <Separator />
          <AccuracyChart projectId={project_id} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">Evaluated Accuracy per Model</p>
          <Separator />
          <div className="flex flex-row items-center gap-5 w-full">
            <ModelAccuracyChart projectId={project_id} />
          </div>
        </div>
      </div>
    );
  }
}
