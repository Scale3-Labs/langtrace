"use client";

import { AddtoDataset } from "@/components/shared/add-to-dataset";
import { Checkbox } from "@/components/ui/checkbox";
import detectPII from "@/lib/pii";
import { correctTimestampFormat } from "@/lib/trace_utils";
import {
  calculatePriceFromUsage,
  cn,
  extractPromptFromLlmInputs,
  formatDateTime,
} from "@/lib/utils";
import { Evaluation } from "@prisma/client";
import { CheckCircledIcon, DotFilledIcon } from "@radix-ui/react-icons";
import { ChevronDown, ChevronRight, ThumbsDown, ThumbsUp } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import Markdown from "react-markdown";
import { useQuery, useQueryClient } from "react-query";
import SetupInstructions from "../../shared/setup-instructions";
import { Spinner } from "../../shared/spinner";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function Eval({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [selectedData, setSelectedData] = useState<CheckedData[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(2);
  const pageSize = 15;
  const [showLoader, setShowLoader] = useState(false);
  const [data, setData] = useState<any>(null);

  const onCheckedChange = (data: CheckedData, checked: boolean) => {
    if (checked) {
      setSelectedData([...selectedData, data]);
    } else {
      setSelectedData(selectedData.filter((d) => d.spanId !== data.spanId));
    }
  };

  const fetchPrompts = useQuery({
    queryKey: ["fetch-prompts-query"],
    queryFn: async () => {
      const response = await fetch(
        `/api/prompt?projectId=${project_id}&page=${page}&pageSize=${pageSize}`
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      // Only update data if result.result is not empty
      if (totalPages !== result?.prompts?.metadata?.total_pages) {
        setTotalPages(result?.prompts?.metadata?.total_pages);
      }
      if (result) {
        const newData = result?.prompts?.result || [];
        if (data) {
          const updatedData = [
            ...data,
            ...newData.filter(
              (newItem: { id: any }) =>
                !data.some(
                  (existingItem: { id: any }) => existingItem.id === newItem.id
                )
            ),
          ];
          setData(updatedData);
        } else {
          setData(result?.prompts?.result || []);
        }
      }
      setPage((currentPage) => currentPage + 1);
      setShowLoader(false);
    },
    refetchOnWindowFocus: false,
  });

  useBottomScrollListener(() => {
    if (fetchPrompts.isRefetching) {
      return;
    }
    if (page < totalPages) {
      setShowLoader(true);
      fetchPrompts.refetch();
    }
  });

  if (fetchPrompts.isLoading || !fetchPrompts.data || !data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full py-6 px-6 flex flex-col gap-4">
      <div className="w-fit">
        <AddtoDataset projectId={project_id} selectedData={selectedData} />
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
        <div className="grid grid-cols-12 items-center justify-stretch gap-3 py-3 pl-4 pr-8 bg-muted">
          <p className="text-xs font-medium">Timestamp (UTC)</p>
          <p className="text-xs font-medium text-center">LLM Vendor</p>
          <p className="text-xs font-medium">Model</p>
          <p className="text-xs font-medium text-center">Input Message</p>
          <p className="text-xs font-medium text-center">Response</p>
          <p className="text-xs font-medium text-center">Cost</p>
          <p className="text-xs font-medium text-center">PII Detected</p>
          <p className="text-xs font-medium text-center">Duration(ms)</p>
          <p className="text-xs font-medium text-end">Evaluate</p>
          <p className="text-xs font-medium text-center">Eval Score</p>
          <p className="text-xs font-medium text-center">User Score</p>
          <p className="text-xs font-medium">Added to Dataset</p>
        </div>
        {!fetchPrompts.isLoading &&
          fetchPrompts.data &&
          data.map((prompt: any, i: number) => {
            return (
              <div className="flex flex-col" key={i}>
                <EvalRow
                  prompt={prompt}
                  projectId={project_id}
                  onCheckedChange={onCheckedChange}
                  selectedData={selectedData}
                />
                <Separator orientation="horizontal" />
              </div>
            );
          })}
        {showLoader && (
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8 text-center" />
          </div>
        )}
        {!fetchPrompts.isLoading && fetchPrompts.data && data.length === 0 && (
          <div className="flex flex-col gap-3 items-center justify-center p-4">
            <p className="text-muted-foreground text-sm mb-3">
              No prompts available. Get started by setting up Langtrace in your
              application.
            </p>
            <SetupInstructions project_id={project_id} />
          </div>
        )}
      </div>
    </div>
  );
}

const EvalRow = ({
  prompt,
  projectId,
  onCheckedChange,
  selectedData,
}: {
  prompt: any;
  projectId: string;
  onCheckedChange: any;
  selectedData: CheckedData[];
}) => {
  const queryClient = useQueryClient();

  const [score, setScore] = useState(-100); // 0: neutral, 1: thumbs up, -1: thumbs down
  const [collapsed, setCollapsed] = useState(true);
  const [evaluation, setEvaluation] = useState<Evaluation>();
  const [addedToDataset, setAddedToDataset] = useState(false);

  const fetchEvaluation = useQuery({
    queryKey: [`fetch-evaluation-query-${prompt.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation?spanId=${prompt.span_id}`);
      const result = await response.json();
      setEvaluation(result.evaluations.length > 0 ? result.evaluations[0] : {});
      setScore(
        result.evaluations.length > 0 ? result.evaluations[0].score : -100
      );
      return result;
    },
  });

  const fetchData = useQuery({
    queryKey: [`fetch-data-query-${prompt.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/data?spanId=${prompt.span_id}`);
      const result = await response.json();
      setAddedToDataset(result.data.length > 0);
      return result;
    },
  });

  const attributes = prompt.attributes ? JSON.parse(prompt.attributes) : {};
  if (!attributes) return null;

  // extract the metrics
  const userScore = attributes["user.feedback.rating"] || "";
  const startTimeMs = new Date(
    correctTimestampFormat(prompt.start_time)
  ).getTime();
  const endTimeMs = new Date(correctTimestampFormat(prompt.end_time)).getTime();
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
  const promptContent = extractPromptFromLlmInputs(prompts);

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
          spanId: prompt.span_id,
          traceId: prompt.trace_id,
          spanStartTime: new Date(correctTimestampFormat(prompt.start_time)),
          score: newScore,
          model: model,
          prompt: promptContent,
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
    queryClient.invalidateQueries(`fetch-evaluation-query-${prompt.span_id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid grid-cols-12 justify-stretch items-start py-1 px-4 w-full cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          className="flex flex-row items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={prompt.span_id}
            onCheckedChange={(state) => {
              const input = JSON.parse(prompts).find(
                (prompt: any) => prompt.role === "user"
              );
              if (!input) return;
              const checkedData = {
                spanId: prompt.span_id,
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
            checked={selectedData.some((d) => d.spanId === prompt.span_id)}
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
            {formatDateTime(correctTimestampFormat(prompt.start_time))}
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center font-semibold">
          {vendor}
        </p>
        <p className="text-xs font-medium text-left">{model}</p>
        <p className="text-xs h-10 truncate overflow-y-scroll font-semibold">
          {prompts?.length > 0 ? JSON.parse(prompts)[0]?.content : ""}
        </p>
        <p className="text-xs h-10 truncate overflow-y-scroll px-4 font-semibold">
          {responses?.length > 0
            ? JSON.parse(responses)[0]?.message?.content ||
              JSON.parse(responses)[0]?.text ||
              JSON.parse(responses)[0]?.content
            : ""}
        </p>
        <p className="text-xs text-center font-semibold">
          {cost.total.toFixed(6) !== "0.000000"
            ? `\$${cost.total.toFixed(6)}`
            : ""}
        </p>
        <div className="flex flex-row gap-0 items-center justify-center font-semibold">
          {piiDetected ? (
            <DotFilledIcon className="text-red-600 w-6 h-6" />
          ) : (
            <DotFilledIcon className="text-green-600 w-6 h-6" />
          )}
          <p className="text-xs">{piiDetected ? "Yes" : "No"}</p>
        </div>
        <p className="text-xs text-muted-foreground text-center font-semibold">
          {durationMs}ms
        </p>
        <div className="flex flex-row items-center gap-3 justify-end">
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
        <p className="text-sm text-center font-semibold">
          {fetchEvaluation.isLoading || !fetchEvaluation.data
            ? "..."
            : score === -100
            ? 0
            : score}
        </p>
        <p className="text-sm text-center font-semibold">{userScore}</p>
        {addedToDataset ? (
          <CheckCircledIcon className="text-green-600 w-5 h-5" />
        ) : (
          ""
        )}
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-6 p-4 border-[1px] border-muted-foreground rounded-md">
          {prompts?.length > 0 &&
            JSON.parse(prompts).map((prompt: any, i: number) => (
              <p
                key={i}
                className="text-xs bg-muted w-fit p-1 rounded-md leading-6"
              >
                <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
                  {prompt.role || "Q"}:
                </span>{" "}
                <Markdown
                  className={cn(
                    detectPII(prompt.content || "").length > 0 &&
                      "underline decoration-red-600 decoration-[3px]"
                  )}
                >
                  {prompt.content || ""}
                </Markdown>
              </p>
            ))}
          <p className="text-xs leading-6 w-fit p-1 rounded-md bg-muted">
            <span className="font-semibold dark:text-red-400 text-red-600">
              Assistant:
            </span>{" "}
            {responses?.length > 0 ? (
              <Markdown
                className={cn(
                  detectPII(
                    JSON.parse(responses)[0]?.message?.content ||
                      JSON.parse(responses)[0]?.text ||
                      JSON.parse(responses)[0]?.content ||
                      ""
                  ).length > 0 &&
                    "underline decoration-red-600 decoration-[3px]"
                )}
              >
                {JSON.parse(responses)[0]?.message?.content ||
                  JSON.parse(responses)[0]?.text ||
                  JSON.parse(responses)[0]?.content}
              </Markdown>
            ) : (
              ""
            )}
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
          </p>
          <div className="flex flex-col gap-0 bg-muted w-fit p-2 rounded-md">
            <p className="text-sm font-semibold">Usage Details</p>
            <div className="flex flex-row items-center gap-3">
              <p className="text-xs font-semibold">Tokens:</p>
              <p className="text-xs font-semibold">
                {tokenCounts?.input_tokens} (input)
              </p>
              {tokenCounts?.input_tokens ? "+" : ""}
              <p className="text-xs font-semibold">
                {tokenCounts?.output_tokens} (output)
              </p>
              {tokenCounts?.output_tokens ? "=" : ""}
              <p className="text-xs font-semibold">
                {tokenCounts?.total_tokens}
              </p>
            </div>
            <div className="flex flex-row items-center gap-3">
              <p className="text-xs font-semibold">Cost:</p>
              <p className="text-xs font-semibold">
                {cost.total.toFixed(6) !== "0.000000"
                  ? `\$${cost.total.toFixed(6)}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
