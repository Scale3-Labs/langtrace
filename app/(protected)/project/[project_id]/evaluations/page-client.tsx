"use client";

import { EvalChart } from "@/components/charts/eval-chart";
import { AddtoDataset } from "@/components/shared/add-to-dataset";
import { HoverCell } from "@/components/shared/hover-cell";
import { LLMView } from "@/components/shared/llm-view";
import { TestSetupInstructions } from "@/components/shared/setup-instructions";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PAGE_SIZE } from "@/lib/constants";
import detectPII from "@/lib/pii";
import { correctTimestampFormat } from "@/lib/trace_utils";
import {
  calculatePriceFromUsage,
  cn,
  extractPromptFromLlmInputs,
  formatDateTime,
} from "@/lib/utils";
import { Evaluation, Test } from "@prisma/client";
import { CheckCircledIcon, DotFilledIcon } from "@radix-ui/react-icons";
import { ProgressCircle } from "@tremor/react";
import { ChevronDown, ChevronRight, ThumbsDown, ThumbsUp } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery, useQueryClient } from "react-query";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export default function PageClient({ email }: { email: string }) {
  const projectId = useParams()?.project_id as string;
  const [selectedTest, setSelectedTest] = useState<Test>();
  const [selectedData, setSelectedData] = useState<CheckedData[]>([]);
  const [currentData, setCurrentData] = useState<any>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchTestAverages = useQuery({
    queryKey: [`fetch-test-averages-${projectId}-query`],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/tests?projectId=${projectId}`);
      const result = await response.json();
      return result;
    },
    refetchOnWindowFocus: false,
  });

  const fetchTests = useQuery({
    queryKey: [`fetch-tests-${projectId}-query`],
    queryFn: async () => {
      const response = await fetch(`/api/test?projectId=${projectId}`);
      const result = await response.json();
      if (result?.tests?.length > 0) {
        setSelectedTest(result?.tests?.[0]);
      }
      return result;
    },
    refetchOnWindowFocus: false,
    enabled: !!fetchTestAverages.data,
  });

  const testAverage =
    fetchTestAverages?.data?.averages?.find(
      (avg: any) => avg.testId === selectedTest?.id
    )?.average || 0;

  return (
    <div className="w-full flex flex-col">
      <div className="md:px-24 px-12 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Evaluations</h1>
        <AddtoDataset projectId={projectId} selectedData={selectedData} />
      </div>
      {fetchTests.isLoading || !fetchTests.data ? (
        <div>Loading...</div>
      ) : (
        fetchTests?.data?.tests?.length > 0 && (
          <div className="flex flex-row gap-4 absolute top-[14rem] w-full md:px-24 px-12">
            <div className="bg-primary-foreground flex flex-col gap-0 border rounded-md w-[12rem] h-fit">
              {fetchTests?.data?.tests?.map((test: Test, i: number) => {
                const average =
                  fetchTestAverages?.data?.averages?.find(
                    (avg: any) => avg.testId === test?.id
                  )?.average || 0;
                return (
                  <div className="flex flex-col" key={i}>
                    <div
                      onClick={() => {
                        setSelectedTest(test);
                        setCurrentData([]);
                        setPage(1);
                        setTotalPages(1);
                      }}
                      className={cn(
                        "flex flex-col gap-4 p-4 items-start cursor-pointer",
                        i === 0 ? "rounded-t-md" : "",
                        i === fetchTests?.data?.tests?.length - 1
                          ? "rounded-b-md"
                          : "",
                        selectedTest?.id === test.id
                          ? "dark:bg-black bg-white border-l-2 border-primary"
                          : ""
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm text-muted-foreground font-semibold",
                          selectedTest?.id === test.id ? "text-primary" : ""
                        )}
                      >
                        {test.name}
                      </p>
                      <ProgressCircle
                        color={getChartColor(average)}
                        value={average}
                        size="sm"
                      >
                        <span className="text-[0.6rem] text-primary font-bold">
                          {average}%
                        </span>
                      </ProgressCircle>
                    </div>
                    <Separator />
                  </div>
                );
              })}
            </div>
            <div className="bg-primary-foreground flex flex-col gap-12 border rounded-md w-full p-4 mb-24">
              <div className="flex flex-row">
                <div className="flex flex-col gap-3 items-start w-[25rem]">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold">
                      {selectedTest?.name} Evaluation
                    </h1>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Test ID: {selectedTest?.id}
                    </span>
                  </div>
                  <ProgressCircle
                    color={getChartColor(testAverage)}
                    value={testAverage}
                    size="md"
                  >
                    <span className="text-sm text-primary font-bold">
                      {testAverage}%
                    </span>
                  </ProgressCircle>
                  <p className="text-sm text-muted-foreground">
                    {selectedTest?.description}
                  </p>
                </div>
                {!selectedTest && <div>Loading...</div>}
                {selectedTest && (
                  <EvalChart projectId={projectId} test={selectedTest} />
                )}
              </div>
              {selectedTest && (
                <EvaluationTable
                  projectId={projectId}
                  test={selectedTest}
                  selectedData={selectedData}
                  setSelectedData={setSelectedData}
                  currentData={currentData}
                  setCurrentData={setCurrentData}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  setTotalPages={setTotalPages}
                />
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EvaluationTable({
  projectId,
  test,
  selectedData,
  setSelectedData,
  currentData,
  setCurrentData,
  page,
  setPage,
  totalPages,
  setTotalPages,
}: {
  projectId: string;
  test: Test;
  selectedData: CheckedData[];
  setSelectedData: (data: CheckedData[]) => void;
  currentData: any;
  setCurrentData: (data: any) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (totalPages: number) => void;
}) {
  const [showLoader, setShowLoader] = useState(false);

  const onCheckedChange = (data: CheckedData, checked: boolean) => {
    if (checked) {
      setSelectedData([...selectedData, data]);
    } else {
      setSelectedData(selectedData.filter((d) => d.spanId !== data.spanId));
    }
  };

  const fetchLlmPromptSpans = useQuery({
    queryKey: [`fetch-llm-prompt-spans-${test.id}-query`],
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
          value: test.name.toLowerCase() !== "factual accuracy" ? test.id : "",
        },
      ];

      // convert filterserviceType to a string
      const apiEndpoint = "/api/spans";
      const body = {
        page,
        pageSize: PAGE_SIZE,
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
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const newData = data?.spans?.result || [];
      const metadata = data?.spans?.metadata || {};

      // Update the total pages and current page number
      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      // Merge the new data with the existing data
      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];

        // Remove duplicates
        const uniqueData = updatedData.filter(
          (v: any, i: number, a: any) =>
            a.findIndex((t: any) => t.span_id === v.span_id) === i
        );

        setCurrentData(uniqueData);
      } else {
        setCurrentData(newData);
      }
      setShowLoader(false);
    },
  });

  useBottomScrollListener(() => {
    if (fetchLlmPromptSpans.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchLlmPromptSpans.refetch();
    }
  });

  return (
    <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
      {currentData.length > 0 && (
        <div className="grid grid-cols-13 items-center gap-3 py-3 px-4 bg-muted rounded-t-md">
          <p className="text-xs font-medium col-span-2 text-end">
            Timestamp (UTC)
          </p>
          <p className="text-xs font-medium">Model</p>
          <p className="text-xs font-medium col-span-2">Input</p>
          <p className="text-xs font-medium col-span-2">Output</p>
          <p className="text-xs font-medium">Cost</p>
          <p className="text-xs font-medium">PII Detected</p>
          <p className="text-xs font-medium">Duration</p>
          <p className="text-xs font-medium">Evaluate</p>
          <p className="text-xs font-medium">User Score</p>
          <p className="text-xs font-medium">Added to Dataset</p>
        </div>
      )}
      {fetchLlmPromptSpans.isLoading ||
      !fetchLlmPromptSpans.data ||
      !currentData ? (
        <div>Loading...</div>
      ) : (
        currentData.map((span: any, i: number) => (
          <EvaluationRow
            key={i}
            span={span}
            projectId={projectId}
            testId={test.id}
            onCheckedChange={onCheckedChange}
            selectedData={selectedData}
          />
        ))
      )}
      {showLoader && (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8 text-center" />
        </div>
      )}
      {!fetchLlmPromptSpans.isLoading &&
        fetchLlmPromptSpans.data &&
        currentData.length === 0 && (
          <div className="flex flex-col gap-3 items-center justify-center p-4">
            <p className="text-sm text-muted-foreground font-semibold mb-3">
              Setup instructions 👇
            </p>
            <TestSetupInstructions testId={test.id} />
          </div>
        )}
    </div>
  );
}

function EvaluationRow({
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

const getChartColor = (value: number) => {
  if (value < 50) {
    return "red";
  } else if (value < 90 && value >= 50) {
    return "yellow";
  } else {
    return "green";
  }
};
