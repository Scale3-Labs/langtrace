"use client";

import { ScaleType } from "@/components/evaluations/eval-scale-picker";
import { RangeScale } from "@/components/evaluations/range-scale";
import UserLogo from "@/components/shared/user-logo";
import { VendorLogo } from "@/components/shared/vendor-metadata";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { correctTimestampFormat } from "@/lib/trace_utils";
import {
  cn,
  extractSystemPromptFromLlmInputs,
  formatDateTime,
  safeStringify,
} from "@/lib/utils";
import { Cross1Icon, EnterIcon } from "@radix-ui/react-icons";
import { ProgressCircle } from "@tremor/react";
import {
  ArrowDownSquareIcon,
  ArrowUpSquareIcon,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  DeleteIcon,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const projectId = useParams()?.project_id as string;
  const testId = useParams()?.test_id as string;
  const page = parseInt(useSearchParams()?.get("page") || "1");
  // const spanId = useSearchParams()?.get("span_id");

  const { isLoading: isTestLoading, data: testData } = useQuery({
    queryKey: ["fetch-test-query", testId],
    queryFn: async () => {
      const response = await fetch(`/api/test?id=${testId}`);
      if (!response.ok) {
        const error = await response.json();
        toast.error("Failed to fetch the test", {
          description: error?.message || "Failed to fetch test",
        });
        router.push(`/project/${projectId}/evaluations`);
        return;
      }
      const result = await response.json();
      return result;
    },
  });

  const [score, setScore] = useState<number>(testData?.test?.min || -1);
  const [scorePercent, setScorePercent] = useState<number>(0);
  const [color, setColor] = useState<string>("red");
  const [span, setSpan] = useState<any>(null);
  const [userScore, setUserScore] = useState<string>();
  const [userScorePercent, setUserScorePercent] = useState<number>(0);
  const [userScoreColor, setUserScoreColor] = useState<string>("red");
  const [totalPages, setTotalPages] = useState<number>(1);
  const queryClient = useQueryClient();

  const { isLoading: isSpanLoading } = useQuery({
    queryKey: ["fetch-spans-query", page, testData?.test?.id],
    queryFn: async () => {
      const filters = [
        {
          key: "llm.prompts",
          operation: "NOT_EQUALS",
          value: "",
        },
        // Accuracy is the default test. So no need to
        // send the testId with the spans when using the SDK.
        {
          key: "langtrace.testId",
          operation: "EQUALS",
          value:
            testData?.test?.name.toLowerCase() !== "factual accuracy"
              ? testData?.test?.id
              : "",
        },
      ];

      // convert filterserviceType to a string
      const apiEndpoint = "/api/spans";
      const body = {
        page,
        pageSize: 1,
        projectId: projectId,
        filters: filters,
        filterOperation: "AND",
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error("Failed to fetch the span data", {
          description: error?.message || "Failed to fetch the span data",
        });
        router.push(`/project/${projectId}/evaluations`);
        return;
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const spans = data?.spans?.result || [];
      const metadata = data?.spans?.metadata || {};

      if (
        metadata?.total_pages <= 0 ||
        page <= 0 ||
        page > parseInt(metadata?.total_pages)
      ) {
        router.push(`/project/${projectId}/evaluations`);
      }

      // Update the total pages and current page number
      setTotalPages(parseInt(metadata?.total_pages) || 1);

      // Update the span state
      if (spans.length > 0) {
        if (spans[0]?.attributes) {
          const attributes = JSON.parse(spans[0]?.attributes);
          setUserScore(attributes["user.feedback.rating"] || "");
          if (attributes["user.feedback.rating"] === 1) {
            setUserScorePercent(100);
            setUserScoreColor("green");
          }
        }
        setSpan(spans[0]);
      }
    },
    enabled: !!testData,
  });

  const next = async () => {
    // Evaluate the current score
    evaluate();
    if (page < totalPages) {
      const nextPage = page + 1;
      router.push(
        `/project/${projectId}/evaluations/${testId}?page=${nextPage}`
      );
    }
  };

  const previous = () => {
    if (page > 1) {
      const previousPage = page - 1;
      router.push(
        `/project/${projectId}/evaluations/${testId}?page=${previousPage}`
      );
    }
  };

  const { isLoading: isEvaluationLoading, data: evaluationsData } = useQuery({
    queryKey: ["fetch-evaluation-query", span?.span_id],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation?spanId=${span?.span_id}`);
      if (!response.ok) {
        const error = await response.json();
        toast.error("Failed to fetch the evaluation data", {
          description: error?.message || "Failed to fetch the evaluation data",
        });
        router.push(`/project/${projectId}/evaluations`);
        return;
      }
      const result = await response.json();
      const sc =
        result.evaluations.length > 0 ? result.evaluations[0].ltUserScore : -1;
      onScoreSelected(sc);
      return result;
    },
    enabled: !!span,
  });

  useEffect(() => {
    const handleKeyPress = (event: any) => {
      if (event.key === "Enter") {
        next();
      }
      if (event.key === "Backspace") {
        previous();
      }

      if (event.key === "Escape") {
        router.push(`/project/${projectId}/evaluations`);
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyPress);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [totalPages, page, evaluationsData, score]);

  const evaluate = async () => {
    // setBusy(true);
    try {
      const attributes = span?.attributes ? JSON.parse(span.attributes) : {};
      if (Object.keys(attributes).length === 0) return;
      const model = attributes["llm.model"];
      const prompts = attributes["llm.prompts"];
      const systemPrompt = extractSystemPromptFromLlmInputs(prompts);

      // Check if an evaluation already exists
      if (evaluationsData?.evaluations[0]?.id) {
        if (evaluationsData.evaluations[0].ltUserScore === score) {
          // setBusy(false);
          return;
        }
        // Update the existing evaluation
        await fetch("/api/evaluation", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: evaluationsData.evaluations[0].id,
            ltUserScore: score,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: ["fetch-evaluation-query", span?.span_id],
        });
      } else {
        // Create a new evaluation
        await fetch("/api/evaluation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: projectId,
            spanId: span.span_id,
            traceId: span.trace_id,
            spanStartTime: span?.start_time
              ? new Date(correctTimestampFormat(span.start_time))
              : new Date(),
            ltUserScore: score,
            model: model,
            prompt: systemPrompt,
            testId: testId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: ["fetch-evaluation-query", span?.span_id],
        });
      }
    } catch (error: any) {
      toast.error("Error evaluating the span!", {
        description: `There was an error evaluating the span: ${error.message}`,
      });
    } finally {
      // setBusy(false);
    }
  };

  const onScoreSelected = (value: number) => {
    setScore(value);

    // Calculate the percentage of the score using min, max and step
    const range = testData?.test?.max - testData?.test?.min;
    const steps = range / testData?.test?.step;
    const scorePercent = ((value - testData?.test?.min) / steps) * 100;
    setScorePercent(scorePercent);

    if (scorePercent < 33) {
      setColor("red");
    }
    if (scorePercent >= 33 && scorePercent < 66) {
      setColor("yellow");
    }
    if (scorePercent >= 66) {
      setColor("green");
    }
  };

  if (isTestLoading || isSpanLoading) {
    return <EvalDialogSkeleton />;
  } else {
    return (
      <div className="flex flex-row gap-6 justify-between px-12 py-6 h-screen">
        <ConversationView span={span} />
        <div className="flex flex-col gap-4 w-1/2 overflow-y-scroll px-2">
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold break-normal capitalize">
                {testData?.test?.name || "No name provided"}
              </h2>
              <p className="text-md text-muted-foreground">
                {testData?.test?.description || "No description provided"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {page}/{totalPages}
              </p>
              <ProgressCircle
                color={"blue"}
                size="md"
                value={(page / totalPages) * 100}
              >
                <span className="flex items-center justify-center font-bold w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 text-sm">
                  {Math.round((page / totalPages) * 100)}%
                </span>
              </ProgressCircle>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold break-normal">
                Evaluation Scale{" "}
              </h3>
              <p className="text-md text-muted-foreground">
                {testData?.test?.min} to {testData?.test?.max} in steps of +
                {testData?.test?.step}
              </p>
            </div>
            {span?.start_time && (
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold break-normal">
                  Timestamp
                </h3>
                <p className="text-md text-muted-foreground">
                  {formatDateTime(correctTimestampFormat(span?.start_time))}
                </p>
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold break-normal">
            Scale
            <span
              className={cn(
                "ml-2 text-xs px-1 py-[2px] rounded-md",
                evaluationsData?.evaluations[0]?.id
                  ? "bg-green-400 dark:bg-green-800"
                  : "bg-orange-400 dark:bg-orange-800"
              )}
            >
              {evaluationsData?.evaluations[0]?.id
                ? "Evaluated"
                : "Not Evaluated"}
            </span>
          </h3>
          {isEvaluationLoading ? (
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="w-12 h-12 rounded-full" />
              ))}
            </div>
          ) : (
            < RangeScale
              variant="large"
              type={ScaleType.Range}
              min={testData?.test?.min}
              max={testData?.test?.max}
              step={testData?.test?.step}
              selectedValue={score}
              onSelectedValueChange={onScoreSelected}
            />
          )}
          <div className="flex gap-12">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold break-normal">
                Evaluted Score
              </h3>
              <ProgressCircle
                value={scorePercent}
                size="lg"
                color={color}
                className="relative"
              >
                <p className="text-4xl font-semibold">{score}</p>
              </ProgressCircle>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold break-normal">User Score</h3>
              {userScore ? (
                <ProgressCircle
                  value={userScorePercent}
                  size="md"
                  color={userScoreColor}
                  className="relative"
                >
                  <p className="text-4xl font-semibold">{userScore}</p>
                </ProgressCircle>
              ) : (
                <p className="text-sm text-muted-foreground font-semibold">
                  Not evaluated
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-24">
            <h3 className="text-lg font-semibold break-normal">Hotkeys</h3>
            <div className="flex flex-row gap-2 items-center">
              <ArrowUpSquareIcon className="text-muted-foreground h-4 w-4" />
              <ArrowDownSquareIcon className="text-muted-foreground h-4 w-4" />
              <p className="text-sm">Arrow keys to navigate the scale</p>
            </div>
            <div className="flex flex-row gap-2">
              <EnterIcon className="text-muted-foreground h-4 w-4" />
              <p className="text-sm">
                Enter/Return to submit the score and continue to the next
                evaluation
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <DeleteIcon className="text-muted-foreground h-4 w-4" />
              <p className="text-sm">
                Delete/Backspace to go back to the previous evaluation
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-sm text-muted-foreground">Esc</p>
              <p className="text-sm">Press Esc to exit the evaluation dialog</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 right-5 flex gap-2 items-center">
          <Button
            variant={"outline"}
            onClick={() => router.push(`/project/${projectId}/evaluations`)}
            disabled={isEvaluationLoading}
          >
            Exit
            <Cross1Icon className="ml-2" />
          </Button>
          <Button variant={"outline"} onClick={previous} disabled={page === 1}>
            <ChevronLeft className="mr-2" />
            Previous
          </Button>
          <Button
            onClick={async () => {
              next();
            }}
            disabled={isEvaluationLoading}
          >
            {page === totalPages ? "Save" : "Save & Next"}
            {page === totalPages ? (
              <CheckIcon className="ml-2" />
            ) : (
              <ChevronRight className="ml-2" />
            )}
          </Button>
        </div>
      </div>
    );
  }
}

function ConversationView({ span }: { span: any }) {
  const attributes = span?.attributes ? JSON.parse(span.attributes) : {};
  if (!attributes) return <p className="text-md">No data found</p>;

  const prompts = attributes["llm.prompts"];
  const responses = attributes["llm.responses"];

  if (!prompts && !responses) return <p className="text-md">No data found</p>;

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll w-1/2 pr-6">
      {prompts?.length > 0 &&
        JSON.parse(prompts).map((prompt: any, i: number) => {
          const role = prompt?.role ? prompt?.role?.toLowerCase() : "User";
          const content = prompt?.content
            ? safeStringify(prompt?.content)
            : prompt?.function_call
              ? safeStringify(prompt?.function_call)
              : "No input found";
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                {role === "user" ? (
                  <UserLogo />
                ) : (
                  <VendorLogo variant="circular" span={span} />
                )}
                <p className="font-semibold text-md capitalize">{role}</p>
                {role === "system" && (
                  <p className="font-semibold text-xs capitalize p-1 rounded-md bg-muted">
                    Prompt
                  </p>
                )}
              </div>
              <div
                className="text-sm bg-muted rounded-md px-2 py-4"
                dangerouslySetInnerHTML={{
                  __html: content,
                }}
              />
            </div>
          );
        })}
      {responses?.length > 0 &&
        JSON.parse(responses).map((response: any, i: number) => {
          const role =
            response?.role?.toLowerCase() ||
            response?.message?.role ||
            "Assistant";
          const content =
            safeStringify(response?.content) ||
            safeStringify(response?.message?.content) ||
            safeStringify(response?.text) ||
            "No output found";
          return (
            <div className="flex flex-col gap-2" key={i}>
              <div className="flex gap-2 items-center">
                {role === "user" ? (
                  <UserLogo />
                ) : (
                  <VendorLogo variant="circular" span={span} />
                )}
                <p className="font-semibold text-md capitalize">{role}</p>
              </div>
              <div
                className="text-sm bg-muted rounded-md px-2 py-4"
                dangerouslySetInnerHTML={{
                  __html: content,
                }}
              />
            </div>
          );
        })}
    </div>
  );
}

function EvalDialogSkeleton() {
  return (
    <div className="p-12 flex flex-row gap-6 justify-between h-[78vh]">
      <div className="flex flex-col gap-4 w-1/2">
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
      </div>
      <div className="flex flex-col gap-4 w-1/2">
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-24 h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-24 h-12" />
        <Skeleton className="w-32 h-32 rounded-full mt-6" />
        <div className="flex gap-4">
          <Skeleton className="w-12 h-6" />
          <Skeleton className="w-48 h-6" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-12 h-6" />
          <Skeleton className="w-48 h-6" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-12 h-6" />
          <Skeleton className="w-48 h-6" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-12 h-6" />
          <Skeleton className="w-48 h-6" />
        </div>
      </div>
    </div>
  );
}
