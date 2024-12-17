import { CreateTest } from "@/components/annotations/create-test";
import { EditTest } from "@/components/annotations/edit-test";
import { ScaleType } from "@/components/annotations/eval-scale-picker";
import { RangeScale } from "@/components/annotations/range-scale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_FEEDBACK_LINK } from "@/lib/constants";
import { LLMSpan } from "@/lib/llm_span_util";
import { Evaluation, Test } from "@prisma/client";
import { ArrowTopRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ProgressCircle } from "@tremor/react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";

export function EvaluateSession({
  span,
  projectId,
  sessionName,
  type,
}: {
  span: LLMSpan;
  projectId: string;
  sessionName: string;
  type: string | null;
}) {
  const {
    data: tests,
    isLoading: testsLoading,
    isError: testsError,
  } = useQuery({
    queryKey: ["fetch-tests-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/test?projectId=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch tests");
      }
      const result = await response.json();

      // sort tests by created date
      result.tests.sort(
        (a: Test, b: Test) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return result.tests as Test[];
    },
    refetchOnWindowFocus: false,
    onError: (error) => {
      toast.error("Failed to fetch tests", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const {
    isLoading,
    data: evaluations,
    isError,
  } = useQuery({
    queryKey: ["fetch-evaluation-query", span?.span_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/evaluation?spanId=${span?.span_id}&projectId=${projectId}&includeTest=true`
      );
      const result = await response.json();
      const evaluations =
        result.evaluations.length > 0 ? result.evaluations : [];
      return evaluations as Evaluation[];
    },
    onError: (error) => {
      toast.error("Failed to fetch evaluations", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const {
    isLoading: feedbackLoading,
    data: feedback,
    isError: feedbackError,
  } = useQuery({
    queryKey: ["fetch-feedback-query", span?.span_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/feedback?spanId=${span?.span_id}&projectId=${projectId}`
      );
      const result = await response.json();
      const evaluations =
        result.evaluations.length > 0 ? result.evaluations : [];
      return evaluations as Evaluation[];
    },
    onError: (error) => {
      toast.error("Failed to fetch evaluations", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size={"sm"} disabled={!type}>
          <ThumbsUp size={16} className="mr-2" />
          Evaluate {type === "session" ? sessionName : type + " call"}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px]">
        <SheetHeader>
          <SheetTitle>Evaluate {sessionName}</SheetTitle>
          <SheetDescription>
            Evaluate {sessionName} on the following tests.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 mt-8">
          <div className="flex gap-2 self-end">
            <CreateTest projectId={projectId} className="w-fit" />
            {testsLoading || testsError || !tests || tests?.length === 0 ? (
              <Button variant="outline" size={"icon"} disabled={true}>
                <DotsHorizontalIcon />
              </Button>
            ) : (
              <EditTest tests={tests} projectId={projectId} className="w-fit" />
            )}
          </div>
          <div className="flex flex-col gap-8 overflow-y-auto max-h-[700px] pb-12">
            {feedbackLoading || feedbackError || !feedback ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="flex flex-col gap-6">
                {feedback?.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">User Feedback</p>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">
                        No user feedback found
                      </p>
                      <Link
                        href={USER_FEEDBACK_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="secondary"
                          size={"sm"}
                          className="w-fit"
                        >
                          Pass User Feedback
                          <ArrowTopRightIcon className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  feedback?.map((f: Evaluation, i) => {
                    return (
                      <div key={i} className="flex flex-col gap-2">
                        <p className="text-lg font-semibold">User Feedback</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">User ID</Badge>
                          <p>{f.userId}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">Rating</Badge>
                          {f.userScore === 1 && (
                            <ThumbsUp className="text-green-500" size={16} />
                          )}
                          {f.userScore === -1 && (
                            <ThumbsDown className="text-red-500" size={16} />
                          )}
                          {f.userScore !== 1 && f.userScore !== -1 && (
                            <p>{f.userScore}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {testsLoading || isLoading || isError || testsError ? (
              <Skeleton className="h-20" />
            ) : (
              tests?.map((test: Test, i) => {
                return (
                  <EvaluateTest
                    key={i}
                    test={test}
                    span={span}
                    projectId={projectId}
                    evaluations={evaluations}
                    type={type || ""}
                  />
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EvaluateTest({
  test,
  span,
  projectId,
  evaluations,
  type,
}: {
  test: Test;
  projectId: string;
  span: LLMSpan;
  evaluations?: Evaluation[];
  type: string;
}) {
  const [score, setScore] = useState(0);
  const [evaluation, setEvaluation] = useState<Evaluation>();
  const [color, setColor] = useState("red");
  const [scorePercent, setScorePercent] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (evaluations && evaluations.length > 0) {
      const evaln = evaluations?.find((e) => e.testId === test.id);
      setEvaluation(evaln);
      if (evaln && evaln.ltUserScore) {
        setScore(evaln.ltUserScore);
        onScoreSelected(test, evaln.ltUserScore);
      } else {
        setScore(0);
        setScorePercent(0);
      }
    } else {
      setScore(0);
      setScorePercent(0);
    }
  }, [span?.span_id]);

  const onScoreSelected = (test: Test, value: number, submit = false) => {
    setScore(value);

    // Calculate the percentage of the score using min, max and step
    if (!test) return;
    const max = test?.max || 0;
    const min = test?.min || 0;
    const range = max - min;
    const scorePercent = ((value - min) / range) * 100;
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
    if (submit) {
      evaluate(value);
    }
  };

  const evaluate = async (value: number) => {
    if (!span?.start_time) return;
    try {
      // Check if an evaluation already exists
      if (evaluation) {
        if (evaluation.ltUserScore === value) {
          return;
        }
        // Update the existing evaluation
        await fetch("/api/evaluation", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: evaluation.id,
            ltUserScore: value,
            testId: test.id,
            spanDate: new Date(span.start_time).toISOString(),
            spanId: span.span_id,
            traceId: span.trace_id,
            type: type,
          }),
        });
        await queryClient.invalidateQueries({
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
            ltUserScore: value,
            testId: test.id,
            type: type,
            spanDate: new Date(span.start_time).toISOString(),
          }),
        });
        await queryClient.invalidateQueries({
          queryKey: ["fetch-evaluation-query", span?.span_id],
        });
      }
    } catch (error: any) {
      toast.error("Error evaluating the span!", {
        description: `There was an error evaluating the span: ${error.message}`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-start">
          <h2 className="text-lg font-semibold break-normal capitalize">
            {test?.name || "No name provided"}
          </h2>
          <ProgressCircle
            value={scorePercent}
            size="xs"
            color={color}
            className="relative"
          >
            <p className="text-lg font-semibold">{score}</p>
          </ProgressCircle>
        </div>
        <p className="text-sm text-muted-foreground">
          {test?.description || "No description provided"}
        </p>
      </div>
      <RangeScale
        variant="md"
        type={ScaleType.Range}
        min={test?.min || 0}
        max={test?.max || 0}
        step={test?.step || 0}
        selectedValue={score}
        onSelectedValueChange={(value) => onScoreSelected(test, value, true)}
      />
    </div>
  );
}
