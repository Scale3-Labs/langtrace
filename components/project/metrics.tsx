"use client";

import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { EvalChart } from "../charts/eval-chart";
import LargeChartLoading from "../charts/large-chart-loading";
import { TraceLatencyChart } from "../charts/latency-chart";
import { ModelAccuracyChart } from "../charts/model-accuracy-chart";
import SmallChartLoading from "../charts/small-chart-loading";
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

  const fetchTests = useQuery({
    queryKey: [`fetch-tests-${project_id}-query`],
    queryFn: async () => {
      const response = await fetch(`/api/test?projectId=${project_id}`);
      const result = await response.json();
      return result;
    },
  });

  if (
    fetchProject.isLoading ||
    !fetchProject.data ||
    fetchTests.isLoading ||
    !fetchTests.data
  ) {
    return <PageLoading />;
  } else {
    // get test obj of factual accuracy test
    const test = fetchTests?.data?.tests?.find(
      (test: any) => test.name === "factual accuracy"
    );
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
          <EvalChart projectId={project_id} test={test} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">Evaluated Accuracy per Model</p>
          <Separator />
          <div className="flex flex-row items-center gap-5 w-full">
            <ModelAccuracyChart projectId={project_id} test={test} />
          </div>
        </div>
      </div>
    );
  }
}

function PageLoading() {
  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold">Usage</p>
        <Separator />
        <div className="flex flex-row items-center gap-5">
          <SmallChartLoading />
          <SmallChartLoading />
          <SmallChartLoading />
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-2">
            <p className="text-lg font-semibold">Latency</p>
          </div>
          <Separator />
          <LargeChartLoading />
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-row items-center gap-2">
          <p className="text-lg font-semibold">Evaluated Accuracy</p>
          <Info information="This is calculated based on your evaluation of the q&a pairs. Go to the Eval tab to start evaluating to see this metric calculated." />
        </div>
        <Separator />
        <LargeChartLoading />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold">Evaluated Accuracy per Model</p>
        <Separator />
        <div className="flex flex-row items-center gap-5 w-full">
          <LargeChartLoading />
        </div>
      </div>
    </div>
  );
}
