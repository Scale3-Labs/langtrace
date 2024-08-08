"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EVALUATIONS_DOCS_URL } from "@/lib/constants";
import { processRun, RunView } from "@/lib/run_util";
import { cn } from "@/lib/utils";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ChevronLeft, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Compare() {
  const router = useRouter();
  // get run id from query params
  const searchParams = useSearchParams();
  const projectId = useParams()?.project_id as string;
  const runIds = searchParams.getAll("run_id") as string[];
  const [isComparable, setIsComparable] = useState<boolean>(false);
  const [runs, setRuns] = useState<RunView[]>([]);

  const { isLoading: experimentsLoading, error: experimentsError } = useQuery({
    queryKey: ["fetch-runs-query", projectId, ...runIds],
    queryFn: async () => {
      const fetchPromises = runIds.map(async (runId) => {
        const response = await fetch(
          `/api/run?projectId=${projectId}&runId=${runId}`
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error?.message || "Failed to fetch the evaluation");
        }
        const result = await response.json();
        return result.run;
      });
      const exps = await Promise.all(fetchPromises);
      const processedRuns: RunView[] = [];
      for (let i = 0; i < exps.length; i++) {
        const run = processRun(exps[i]);
        processedRuns.push(run);
      }
      setRuns(processedRuns);
      setIsComparable(verifyIfSampleInputsMatch(processedRuns));
      return exps;
    },
    onError: (error) => {
      toast.error("Failed to fetch one or more evaluations", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="px-12 py-12 flex flex-col gap-2 bg-muted">
        <h1 className="text-md font-semibold">Comparing Runs</h1>
        <p className="text-sm w-1/2">{runIds.join(", ")}</p>
      </div>
      <div className="flex flex-col gap-12 w-full px-12">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="text-muted-foreground" size={20} />
            Back
          </Button>
        </div>
        {(experimentsError as any) && (
          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-center text-md">
              Failed to fetch evaluations for comparison.
            </p>
            <Button onClick={() => router.back()}>
              <ChevronLeft className="text-muted-foreground" size={20} />
              Back
            </Button>
          </div>
        )}
        {!experimentsLoading &&
          !experimentsError &&
          (!runs ||
            (runs?.length === 0 && (
              <div className="flex flex-col items-center gap-2 mt-6">
                <p className="text-center text-md">
                  No evaluations found for comparison.
                </p>
                <Link href={EVALUATIONS_DOCS_URL} target="_blank">
                  <Button className="w-fit">
                    New Evaluation
                    <FlaskConical className="ml-1 h-4 w-4" />
                    <ArrowTopRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )))}
        {!experimentsLoading && !isComparable && (
          <div className="flex flex-col items-center gap-2 mt-24">
            <p className="text-center text-md">
              The selected evaluations are not comparable. Please select
              evaluations ran against the same dataset.
            </p>
            <Button onClick={() => router.back()}>
              <ChevronLeft className="text-muted-foreground" size={20} />
              Back
            </Button>
          </div>
        )}
        {!experimentsLoading && isComparable && runs.length > 0 && (
          <div className="overflow-y-scroll">
            <table className="table-auto overflow-x-scroll w-screen border-separate border border-muted rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 rounded-md text-sm font-medium">Input</th>
                  <th className="p-2 rounded-md text-sm font-medium">Target</th>
                  {runs.map((run, i) => (
                    <th
                      key={i}
                      className="p-2 rounded-md text-sm font-medium"
                    >{`Output - (${run.model})`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs[0].samples.map((_: any, i: number) => (
                  <SampleRow key={i} index={i} runs={runs} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {experimentsLoading && <Skeleton className="w-full h-96" />}
      </div>
    </div>
  );
}

function SampleRow({ index, runs }: { index: number; runs: RunView[] }) {
  const [open, setOpen] = useState(false);
  return (
    <tr
      className="hover:cursor-pointer hover:bg-muted group"
      onClick={() => setOpen(!open)}
    >
      <td className={cn("text-sm px-2 py-1 max-w-80 relative")}>
        {runs[0]?.samples[index]?.input || "none"}
      </td>
      <td className={cn("relative text-sm px-2 py-1 max-w-80")}>
        {runs[0]?.samples[index]?.target || "none"}
      </td>
      {runs.map((run: RunView, i: number) => (
        <td key={i} className={cn("px-2 py-1 max-w-80 relative")}>
          <div className="flex flex-col gap-2">
            <Badge variant={"secondary"} className="w-fit">
              {run.model}
            </Badge>
            <p className="text-sm">{run.samples[index]?.output || "none"}</p>
          </div>
        </td>
      ))}
    </tr>
  );
}

function verifyIfSampleInputsMatch(runs: RunView[]): boolean {
  if (runs.length === 0) return false;

  // also check if the length of samples is the same for all experiments
  for (let j = 1; j < runs?.length; j++) {
    if (runs[j]?.samples?.length !== runs[0]?.samples?.length) return false;
  }

  // iterate through each experiment and each sample and check if the input of sample at index i matches with the input of sample at index i for all experiments
  for (let i = 0; i < runs[0]?.samples?.length; i++) {
    const input = runs[0]?.samples[i]?.input;
    for (let j = 1; j < runs?.length; j++) {
      if (JSON.stringify(input) !== JSON.stringify(runs[j]?.samples[i]?.input))
        return false;
    }
  }

  return true;
}
