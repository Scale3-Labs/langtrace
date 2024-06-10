"use client";

import { Conversation } from "@/components/shared/conversation-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Copy, MoveDiagonal, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import data from "../experiment_result";

export default function Experiments() {
  const router = useRouter();
  const runId = useParams()?.run_id as string;
  const experiment = data.find((exp) => exp.eval.run_id === runId);
  const [expand, setExpand] = useState(
    experiment?.samples && experiment?.samples?.length > 0
      ? experiment?.samples.map(() => false)
      : []
  );
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-2xl font-semibold">Run ID: {runId}</h1>
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
          <Button
            variant={"outline"}
            size={"icon"}
            onClick={() => {
              setExpand(
                expand.map(() => {
                  return !expand[0];
                })
              );
            }}
          >
            {expand.some((v) => v === false) && (
              <MoveDiagonal className="text-muted-foreground" size={20} />
            )}
            {!expand.some((v) => v === false) && (
              <X className="text-muted-foreground" size={20} />
            )}
          </Button>
        </div>
        {!experiment ||
          (experiment?.samples?.length === 0 && (
            <div className="flex flex-col items-center gap-2 mt-6">
              <p className="text-center text-md">
                No samples found for this experiment.
              </p>
              <Button className="w-fit">New Experiment</Button>
            </div>
          ))}
        {experiment?.samples && experiment?.samples?.length > 0 && (
          <div className="overflow-y-scroll">
            <table className="table-auto overflow-x-scroll w-screen border-separate border border-muted rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="w-12 rounded-md p-2">
                    <Checkbox />
                  </th>
                  <th className="p-2 rounded-md text-sm font-medium">Input</th>
                  <th className="p-2 rounded-md text-sm font-medium">Target</th>
                  <th className="p-2 rounded-md text-sm font-medium">{`Output - (${experiment.eval.model})`}</th>
                  <th className="p-2 rounded-md text-sm font-medium">
                    Explanation
                  </th>
                </tr>
              </thead>
              <tbody>
                {experiment.samples.map((sample, i) => (
                  <SampleRow
                    key={i}
                    index={i}
                    plan={experiment.plan}
                    sample={sample}
                    model={experiment.eval.model}
                    expand={expand[i]}
                    setExpand={(value: boolean, index: number) => {
                      setExpand(
                        expand.map((_, j) => {
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
      <td className="px-2 py-1 text-center">
        <Checkbox onClick={(e) => e.stopPropagation()} />
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

function ExpandContractButton({
  index,
  expand,
  setExpand,
}: {
  index: number;
  expand: boolean;
  setExpand: (expand: boolean, index: number) => void;
}) {
  return (
    <Button
      variant={"outline"}
      size={"icon"}
      className="w-6 h-6 flex items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        setExpand(!expand, index);
      }}
    >
      {!expand && <MoveDiagonal className="text-muted-foreground" size={20} />}
      {expand && <X className="text-muted-foreground" size={20} />}
    </Button>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <Button
      variant={"outline"}
      size={"icon"}
      className={"w-6 h-6 flex items-center justify-center"}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }}
    >
      <Copy className="text-muted-foreground" size={15} />
    </Button>
  );
}

function UtilityButton({
  index,
  expand,
  setExpand,
  text,
}: {
  index: number;
  expand: boolean;
  setExpand: (expand: boolean, index: number) => void;
  text: string;
}) {
  return (
    <div className="absolute group-hover:flex gap-0 items-center hidden top-0 right-0">
      <ExpandContractButton
        index={index}
        expand={expand}
        setExpand={setExpand}
      />
      <CopyButton text={text} />
    </div>
  );
}
