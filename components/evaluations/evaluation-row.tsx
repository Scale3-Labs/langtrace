"use client";

import { HoverCell } from "@/components/shared/hover-cell";
import { LLMView } from "@/components/shared/llm-view";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import detectPII from "@/lib/pii";
import { correctTimestampFormat } from "@/lib/trace_utils";
import {
  calculatePriceFromUsage,
  cn,
  extractSystemPromptFromLlmInputs,
  formatDateTime,
} from "@/lib/utils";
import { Evaluation } from "@prisma/client";
import { CheckCircledIcon, DotFilledIcon } from "@radix-ui/react-icons";
import { ChevronDown, ChevronRight, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function EvaluationRow({
  key,
  span,
  projectId,
  testId,
  onCheckedChange,
  selectedData,
}: {
  key: number;
  span: any;
  projectId: string;
  testId: string;
  onCheckedChange: (data: CheckedData, checked: boolean) => void;
  selectedData: CheckedData[];
}) {
  const queryClient = useQueryClient();

  const [score, setScore] = useState(-100); // 0: neutral, 1: thumbs up, -1: thumbs down
  const [collapsed, setCollapsed] = useState(true);
  const [evaluation, setEvaluation] = useState<Evaluation>();
  const [addedToDataset, setAddedToDataset] = useState(false);

  useQuery({
    queryKey: [`fetch-evaluation-query-${span.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation?spanId=${span.span_id}`);
      const result = await response.json();
      setEvaluation(result.evaluations.length > 0 ? result.evaluations[0] : {});
      setScore(
        result.evaluations.length > 0 ? result.evaluations[0].score : -100
      );
      return result;
    },
  });

  useQuery({
    queryKey: [`fetch-data-query-${span.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/data?spanId=${span.span_id}`);
      const result = await response.json();
      setAddedToDataset(result.data.length > 0);
      return result;
    },
    refetchOnMount: false,
  });

  const attributes = span.attributes ? JSON.parse(span.attributes) : {};
  if (!attributes) return null;

  // extract the metrics
  const userScore = attributes["user.feedback.rating"] || "";
  const startTimeMs = new Date(
    correctTimestampFormat(span.start_time)
  ).getTime();
  const endTimeMs = new Date(correctTimestampFormat(span.end_time)).getTime();
  const durationMs = endTimeMs - startTimeMs;
  const prompts = attributes["llm.prompts"];
  const responses = attributes["llm.responses"];
  let model = "";
  let vendor = "";
  let tokenCounts: any = {};
  let cost = { total: 0, input: 0, output: 0 };
  if (attributes["llm.token.counts"]) {
    model = attributes["llm.model"];
    vendor = attributes["langtrace.service.name"];
    tokenCounts = JSON.parse(attributes["llm.token.counts"]);
    cost = calculatePriceFromUsage(vendor.toLowerCase(), model, tokenCounts);
  }
  const promptContent = extractSystemPromptFromLlmInputs(prompts);

  // check for pii detections
  let piiDetected = false;
  for (const prompt of JSON.parse(prompts)) {
    if (detectPII(prompt.content || "").length > 0) {
      piiDetected = true;
      break;
    }
  }
  piiDetected =
    piiDetected ||
    detectPII(
      JSON.parse(responses)[0]?.message?.content ||
        JSON.parse(responses)[0]?.text ||
        JSON.parse(responses)[0]?.content ||
        ""
    ).length > 0;

  // score evaluation
  const evaluateSpan = async (newScore: number) => {
    if (!evaluation?.id) {
      // Evaluate
      await fetch("/api/evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          spanId: span.span_id,
          traceId: span.trace_id,
          spanStartTime: new Date(correctTimestampFormat(span.start_time)),
          score: newScore,
          model: model,
          prompt: promptContent,
          testId: testId,
        }),
      });
    } else {
      await fetch("/api/evaluation", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: evaluation?.id,
          score: newScore,
        }),
      });
    }

    // Invalidate the evaluations query to refetch the updated evaluations
    queryClient.invalidateQueries(`fetch-evaluation-query-${span.span_id}`);
    queryClient.invalidateQueries(`fetch-test-averages-${projectId}-query`);
    queryClient.invalidateQueries(
      `fetch-accuracy-${projectId}-${testId}-query`
    );
  };

  const LlmViewEvaluation = () => {
    return (
      <div className="flex flex-row items-center gap-3 justify-end mb-2 mr-2 mt-2">
        <Button
          size={"icon"}
          variant={score === 1 ? "default" : "secondary"}
          onClick={(e) => {
            e.stopPropagation();

            if (score === 1) {
              evaluateSpan(0);
              setScore(0);
            } else {
              evaluateSpan(1);
              setScore(1);
            }
          }}
        >
          <ThumbsUp className={"h-5 w-5"} />
        </Button>
        <Button
          size={"icon"}
          variant={score === -1 ? "default" : "secondary"}
          onClick={(e) => {
            e.stopPropagation();

            if (score === -1) {
              evaluateSpan(0);
              setScore(0);
            } else {
              evaluateSpan(-1);
              setScore(-1);
            }
          }}
        >
          <ThumbsDown className={"h-5 w-5"} />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full" key={key}>
      <div
        className="grid grid-cols-13 items-center gap-3 py-3 px-4 w-full cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          className="flex flex-row items-center gap-2 col-span-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={span.span_id}
            onCheckedChange={(state: boolean) => {
              const input = JSON.parse(prompts).find(
                (prompt: any) => prompt.role === "user"
              );
              if (!input) return;
              const checkedData = {
                spanId: span.span_id,
                input: input?.content || "",
                output:
                  responses?.length > 0
                    ? JSON.parse(responses)[0]?.message?.content ||
                      JSON.parse(responses)[0]?.text ||
                      JSON.parse(responses)[0]?.content
                    : "",
              };
              onCheckedChange(checkedData, state);
            }}
            checked={selectedData.some((d) => d.spanId === span.span_id)}
          />
          <Button
            variant={"ghost"}
            size={"icon"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed && (
              <ChevronRight className="text-muted-foreground w-5 h-5" />
            )}
            {!collapsed && (
              <ChevronDown className="text-muted-foreground w-5 h-5" />
            )}
          </Button>
          <p className="text-xs text-muted-foreground font-semibold">
            {formatDateTime(correctTimestampFormat(span.start_time))}
          </p>
        </div>
        <p className="text-xs font-medium">{model}</p>
        <HoverCell
          className="text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
          value={prompts?.length > 0 ? JSON.parse(prompts)[0]?.content : ""}
        />
        <HoverCell
          className="text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
          value={
            responses?.length > 0
              ? JSON.parse(responses)[0]?.message?.content ||
                JSON.parse(responses)[0]?.text ||
                JSON.parse(responses)[0]?.content
              : ""
          }
        />
        <p className="text-xs font-semibold">
          {cost.total.toFixed(6) !== "0.000000"
            ? `\$${cost.total.toFixed(6)}`
            : ""}
        </p>
        <div className="flex flex-row gap-0 items-center font-semibold">
          {piiDetected ? (
            <DotFilledIcon className="text-red-600 w-6 h-6" />
          ) : (
            <DotFilledIcon className="text-green-600 w-6 h-6" />
          )}
          <p className="text-xs">{piiDetected ? "Yes" : "No"}</p>
        </div>
        <p className="text-xs text-muted-foreground font-semibold">
          {durationMs}ms
        </p>
        <div className="flex flex-row items-center gap-3">
          <Button
            size={"icon"}
            variant={"ghost"}
            onClick={(e) => {
              e.stopPropagation();
              if (score === 1) {
                evaluateSpan(0);
                setScore(0);
              } else {
                evaluateSpan(1);
                setScore(1);
              }
            }}
          >
            <ThumbsUp
              className={cn(
                "h-5 w-5",
                score === 1 ? "fill-green-600 text-green-600" : ""
              )}
            />
          </Button>
          <Button
            size={"icon"}
            variant={"ghost"}
            onClick={(e) => {
              e.stopPropagation();
              if (score === -1) {
                evaluateSpan(0);
                setScore(0);
              } else {
                evaluateSpan(-1);
                setScore(-1);
              }
            }}
          >
            <ThumbsDown
              className={cn(
                "h-5 w-5",
                score === -1 ? "fill-red-600 text-red-600" : ""
              )}
            />
          </Button>
        </div>
        <p className="text-sm font-semibold">{userScore}</p>
        {addedToDataset ? (
          <CheckCircledIcon className="text-green-600 w-5 h-5" />
        ) : (
          ""
        )}
      </div>
      {!collapsed && (
        <LLMView
          responses={responses}
          prompts={prompts}
          doPiiDetection={true}
          Evaluate={LlmViewEvaluation}
        />
      )}
    </div>
  );
}
