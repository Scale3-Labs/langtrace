"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import data from "../experiment_result";

export default function Experiments() {
  const router = useRouter();
  // get run id from query params
  const searchParams = useSearchParams();
  const runIds = searchParams.getAll("run_id") as string[];
  const experiments = data.filter((exp) => runIds.includes(exp.eval.run_id));
  const isComparable = verifyIfSampleInputsMatch(runIds, data);
  if (!isComparable) {
    return (
      <div className="flex flex-col items-center gap-2 mt-24">
        <p className="text-center text-md">
          The selected experiments are not comparable. Please select experiments
          ran against the same dataset.
        </p>
        <Button className="w-fit">New Experiment</Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        {/* <h1 className="text-2xl font-semibold">Run ID: {runId}</h1> */}
        <Button variant={data.length > 0 ? "default" : "outline"}>
          New Experiment
        </Button>
      </div>
      <div className="flex flex-col gap-12 w-full px-12">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="text-muted-foreground" size={20} />
            Back
          </Button>
        </div>
        {!experiments ||
          (experiments?.length === 0 && (
            <div className="flex flex-col items-center gap-2 mt-6">
              <p className="text-center text-md">
                No experiments found for comparison.
              </p>
              <Button className="w-fit">New Experiment</Button>
            </div>
          ))}
        {experiments[0]?.samples && experiments[0]?.samples?.length > 0 && (
          <div className="overflow-y-scroll">
            <table className="table-auto overflow-x-scroll w-screen border-separate border border-muted rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="w-12 rounded-md p-2">
                    <Checkbox />
                  </th>
                  <th className="p-2 rounded-md text-sm font-medium">Input</th>
                  <th className="p-2 rounded-md text-sm font-medium">Target</th>
                  {experiments.map((experiment, i) => (
                    <th
                      key={i}
                      className="p-2 rounded-md text-sm font-medium"
                    >{`Output - (${experiment.eval.model})`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {experiments[0].samples.map((_: any, i: number) => (
                  <SampleRow key={i} index={i} experiments={experiments} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SampleRow({
  index,
  experiments,
}: {
  index: number;
  experiments: any;
}) {
  const [open, setOpen] = useState(false);
  return (
    <tr
      className="hover:cursor-pointer hover:bg-muted group"
      onClick={() => setOpen(!open)}
    >
      <td className="px-2 py-1 text-center">
        <Checkbox onClick={(e) => e.stopPropagation()} />
      </td>
      <td className={cn("text-sm px-2 py-1 max-w-80 relative")}>
        {typeof experiments[0]?.samples[index]?.input === "string"
          ? experiments[0]?.samples[index]?.input
          : Array.isArray(experiments[0]?.samples[index]?.input)
          ? experiments[0]?.samples[index]?.input[
              experiments[0]?.samples[index]?.input?.length - 1
            ]?.content
          : ""}
      </td>
      <td className={cn("relative text-sm px-2 py-1 max-w-80")}>
        {experiments[0]?.samples[index]?.target || "none"}
      </td>
      {experiments.map((experiment: any, i: number) => (
        <td key={i} className={cn("px-2 py-1 max-w-80 relative")}>
          <div className="flex flex-col gap-2">
            <Badge
              className={cn(
                experiment?.samples[index]?.score?.value === "I"
                  ? "hover:bg-red-200 bg-red-200 text-destructive border-destructive"
                  : "hover:bg-green-200 bg-green-200 text-green-700 border-green-700",
                "border w-fit"
              )}
            >
              {experiment?.samples[index]?.score?.value === "I"
                ? "INCORRECT"
                : "CORRECT"}
            </Badge>
            <Badge variant={"secondary"} className="w-fit">
              {experiment?.samples[index]?.output?.model || ""}
            </Badge>
            <p className="text-sm">
              {experiment?.samples[index]?.output?.choices &&
              experiment?.samples[index]?.output?.choices?.length > 0
                ? experiment?.samples[index]?.output?.choices[
                    experiment?.samples[index]?.output?.choices?.length - 1
                  ].message?.content
                : ""}
            </p>
          </div>
        </td>
      ))}
    </tr>
  );
}

function verifyIfSampleInputsMatch(runIds: string[], data: any): boolean {
  const experiments = data.filter((exp: any) =>
    runIds.includes(exp.eval.run_id)
  );
  if (experiments.length === 0) return false;

  // iterate through each experiment and each sample and check if the input of sample at index i matches with the input of sample at index i for all experiments
  for (let i = 0; i < experiments[0]?.samples?.length; i++) {
    const input = experiments[0]?.samples[i]?.input;
    for (let j = 1; j < experiments?.length; j++) {
      if (
        JSON.stringify(input) !==
        JSON.stringify(experiments[j]?.samples[i]?.input)
      )
        return false;
    }
  }

  return true;
}
