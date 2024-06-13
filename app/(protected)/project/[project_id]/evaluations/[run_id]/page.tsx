"use client";

import { UtilityButton } from "@/components/evaluations/report-utility";
import { Conversation } from "@/components/shared/conversation-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EVALUATIONS_DOCS_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  MoveDiagonal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Evaluation() {
  const router = useRouter();
  const runId = useParams()?.run_id as string;
  const projectId = useParams()?.project_id as string;

  const [expand, setExpand] = useState<boolean[]>();
  const [experiment, setExperiment] = useState<any>({});

  const { isLoading: experimentLoading, error: experimentError } = useQuery({
    queryKey: ["fetch-experiments-query", projectId, runId],
    queryFn: async () => {
      const response = await fetch(
        `/api/run?projectId=${projectId}&runId=${runId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch the evaluation");
      }
      const result = await response.json();
      if (!result.run || !result.run.log) {
        throw new Error("No evaluations found");
      }
      const exp = JSON.parse(result.run.log);
      setExperiment(exp);
      setExpand(
        exp?.samples && exp?.samples?.length > 0
          ? exp?.samples.map(() => false)
          : []
      );
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch the evaluation", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="px-12 py-12 flex justify-between bg-muted">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold">Run ID</h1>
          <p className="text-md">{runId}</p>
          {!experimentError && !experimentLoading && (
            <Badge
              className={cn(
                "capitalize w-fit",
                experiment.status === "success"
                  ? "text-green-600 bg-green-200 hover:bg-green-200"
                  : "text-destructive bg-red-200 hover:bg-red-200"
              )}
            >
              {experiment.status}
            </Badge>
          )}
        </div>
        <Link href={EVALUATIONS_DOCS_URL} target="_blank">
          <Button
            variant={
              experiment && experiment?.samples?.length > 0
                ? "outline"
                : "default"
            }
          >
            New Evaluation
            <FlaskConical className="ml-1 h-4 w-4" />
            <ArrowTopRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="flex flex-col gap-6 w-full px-12">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="text-muted-foreground" size={20} />
            Back
          </Button>
          {!experimentError && !experimentLoading && (
            <Button
              variant={"outline"}
              size={"icon"}
              disabled={
                !experiment?.samples || experiment?.samples?.length === 0
              }
              onClick={() => {
                setExpand(
                  expand &&
                    expand.map(() => {
                      return !expand[0];
                    })
                );
              }}
            >
              {expand && expand.some((v: any) => v === false) && (
                <MoveDiagonal size={20} />
              )}
              {expand && !expand.some((v: any) => v === false) && (
                <X size={20} />
              )}
            </Button>
          )}
        </div>
        {experiment?.error && (
          <div className="flex flex-col gap-4">
            <p className="text-xl text-center font-semibold">
              An error occurred while running this evaluation. See below for
              more details
            </p>
            <div className="flex flex-col gap-2 p-2 border border-muted-foreground bg-muted rounded-md">
              <pre className="text-start text-md">
                {experiment.error.message || "An error occurred."}
              </pre>
              <pre className="text-start text-sm">
                {experiment.error.traceback || "No traceback available."}
              </pre>
            </div>
          </div>
        )}
        {experimentError && (
          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-center text-md">
              Failed to fetch the evaluation. Please try again later.
            </p>
          </div>
        )}
        {((!experimentError && !experimentLoading && !experiment?.samples) ||
          experiment?.samples?.length === 0) && (
          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-center text-md">
              No samples found for this evaluation.
            </p>
            <Link href={EVALUATIONS_DOCS_URL} target="_blank">
              <Button className="w-fit">
                New Evaluation
                <FlaskConical className="ml-1 h-4 w-4" />
                <ArrowTopRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
        {!experimentLoading &&
          experiment?.samples &&
          experiment?.samples?.length > 0 && (
            <div className="overflow-y-scroll">
              <table className="table-auto overflow-x-scroll w-screen border-separate border border-muted rounded-md">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Input
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Target
                    </th>
                    <th className="p-2 rounded-md text-sm font-medium">{`Output - (${experiment.eval.model})`}</th>
                    <th className="p-2 rounded-md text-sm font-medium">
                      Explanation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {experiment.samples.map((sample: any, i: number) => (
                    <SampleRow
                      key={i}
                      index={i}
                      plan={experiment.plan}
                      sample={sample}
                      model={experiment.eval.model}
                      expand={expand ? expand[i] : false}
                      setExpand={(value: boolean, index: number) => {
                        setExpand(
                          expand &&
                            expand.map((_: any, j: number) => {
                              return j === index ? value : expand[j];
                            })
                        );
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {experimentLoading && <Skeleton className="w-full h-96" />}
      </div>
    </div>
  );
}

function SampleRow({
  index,
  sample,
  plan,
  model,
  expand,
  setExpand,
}: {
  index: number;
  sample: any;
  plan: any;
  model: string;
  expand: boolean;
  setExpand: (value: boolean, index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <tr
      className="hover:cursor-pointer hover:bg-muted group"
      onClick={() => setOpen(!open)}
    >
      <td
        className={cn(
          "text-sm px-2 py-1 max-w-80 relative",
          expand ? "" : "truncate"
        )}
      >
        <UtilityButton
          index={index}
          expand={expand}
          setExpand={setExpand}
          text={sample.input || ""}
        />
        {typeof sample.input === "string"
          ? sample.input
          : Array.isArray(sample.input)
          ? sample.input[sample.input.length - 1].content
          : ""}
      </td>
      <td
        className={cn(
          "relative text-sm px-2 py-1 max-w-80",
          expand ? "" : "truncate"
        )}
      >
        <UtilityButton
          index={index}
          expand={expand}
          setExpand={setExpand}
          text={sample.target || ""}
        />
        {sample.target || "none"}
      </td>
      <td
        className={cn("px-2 py-1 max-w-80 relative", expand ? "" : "truncate")}
      >
        <UtilityButton
          index={index}
          expand={expand}
          setExpand={setExpand}
          text={
            sample.output?.choices && sample.output.choices?.length > 0
              ? sample.output.choices[sample.output.choices.length - 1].message
                  ?.content
              : ""
          }
        />
        <div className="flex flex-col gap-2">
          <Badge
            className={cn(
              sample.score?.value === "I"
                ? "hover:bg-red-200 bg-red-200 text-destructive border-destructive"
                : "hover:bg-green-200 bg-green-200 text-green-700 border-green-700",
              "border w-fit"
            )}
          >
            {sample.score?.value === "I" ? "INCORRECT" : "CORRECT"}
          </Badge>
          <Badge variant={"secondary"} className="w-fit">
            {sample.output?.model || ""}
          </Badge>
          <p className="text-sm">
            {sample.output?.choices && sample.output.choices?.length > 0
              ? sample.output.choices[sample.output.choices.length - 1].message
                  ?.content
              : ""}
          </p>
        </div>
      </td>
      <td
        className={cn(
          "text-sm px-2 py-1 max-w-80 relative",
          expand ? "" : "truncate"
        )}
      >
        <UtilityButton
          index={index}
          expand={expand}
          setExpand={setExpand}
          text={sample.score?.explanation || ""}
        />
        {sample.score?.explanation || "none"}
      </td>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          className={"overflow-y-scroll w-1/4"}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader>
            <SheetTitle>Messages</SheetTitle>
            <SheetDescription>
              Messages exchanged between the model and the user.
            </SheetDescription>
          </SheetHeader>
          <Separator className="my-3" />
          <p className="text-medium my-3 font-semibold">Plan</p>
          <div className="flex my-4 gap-2 flex-wrap items-center">
            {plan.steps.map((step: any, i: number) => (
              <div className="flex gap-2 items-center" key={i}>
                <Badge variant={"outline"}>{step.solver}</Badge>
                {i < plan.steps.length - 1 && <ChevronRight size={12} />}
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <p className="text-medium my-3 font-semibold">Messages</p>
          <Conversation messages={sample.messages} model={model} />
        </SheetContent>
      </Sheet>
    </tr>
  );
}
