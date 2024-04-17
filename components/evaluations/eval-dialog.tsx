import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Test } from "@prisma/client";
import { Cross1Icon, EnterIcon } from "@radix-ui/react-icons";
import { ProgressCircle } from "@tremor/react";
import {
  ArrowLeftSquareIcon,
  ArrowRightSquareIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  DeleteIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { useQuery } from "react-query";
import { VendorLogo } from "../shared/vendor-metadata";
import { ScaleType } from "./eval-scale-picker";
import { RangeScale } from "./range-scale";

export function EvalDialog({
  test,
  projectId,
}: {
  test: Test;
  projectId: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 background-animate"
          variant="default"
        >
          Start Testing <ChevronsRight className="ml-2" />{" "}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-full max-w-screen-lg h-5/6">
        <EvalContent test={test} projectId={projectId} />
        <AlertDialogFooter className="absolute bottom-5 right-5">
          <AlertDialogCancel>
            Exit
            <Cross1Icon className="ml-2" />
          </AlertDialogCancel>
          <Button variant={"outline"}>
            <ChevronLeft className="mr-2" />
            Previous
          </Button>
          <Button>
            Next
            <ChevronRight className="ml-2" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EvalContent({ test, projectId }: { test: Test; projectId: string }) {
  const min = test?.min !== undefined && test?.min !== null ? test.min : -1;
  const max = test?.max !== undefined && test?.max !== null ? test.max : 1;
  const step = test?.step !== undefined && test?.step !== null ? test.step : 2;
  const [score, setScore] = useState<number>(min);
  const [scorePercent, setScorePercent] = useState<number>(0);
  const [color, setColor] = useState<string>("red");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [span, setSpan] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>({});
  const [addedToDataset, setAddedToDataset] = useState<boolean>(false);

  // Reset the score and color when the test changes
  useEffect(() => {
    setScore(test?.min !== undefined && test?.min !== null ? test.min : -1);
    setScorePercent(0);
    setColor("red");
    setPage(1);
    setTotalPages(1);
    setSpan(null);
  }, [test]);

  const { isLoading } = useQuery({
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
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const spans = data?.spans?.result || [];
      const metadata = data?.spans?.metadata || {};

      // Update the total pages and current page number
      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) < parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      // Update the span state
      if (spans.length > 0) {
        setSpan(spans[0]);
      }
    },
  });

  useQuery({
    queryKey: [`fetch-evaluation-query-${span?.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation?spanId=${span.span_id}`);
      const result = await response.json();
      setEvaluation(result.evaluations.length > 0 ? result.evaluations[0] : {});
      setScore(
        result.evaluations.length > 0 ? result.evaluations[0].score : min
      );
      return result;
    },
    enabled: !!span,
  });

  useQuery({
    queryKey: [`fetch-data-query-${span?.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/data?spanId=${span.span_id}`);
      const result = await response.json();
      setAddedToDataset(result.data.length > 0);
      return result;
    },
    enabled: !!span,
  });

  const onScoreSelected = (value: number) => {
    setScore(value);

    // Calculate the percentage of the score using min, max and step
    const range = max - min;
    const steps = range / step;
    const scorePercent = ((value - min) / steps) * 100;
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

  return (
    <div className="flex flex-row gap-6 justify-between h-[78vh]">
      {isLoading ? <p>Loading</p> : <ConversationView span={span} />}
      <div className="flex flex-col gap-4 w-1/2 overflow-y-scroll px-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold break-normal capitalize">
            {test?.name || "No name provided"}
          </h2>
          <p className="text-md text-muted-foreground">
            {test?.description || "No description provided"}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold break-normal">
            Evaluation Scale
          </h3>
          <p className="text-md text-muted-foreground">
            {min} to {max} in steps of +{step}
          </p>
        </div>
        <h3 className="text-lg font-semibold break-normal">Scale</h3>
        <RangeScale
          variant="large"
          type={ScaleType.Range}
          min={min}
          max={max}
          step={step}
          selectedValue={score}
          onSelectedValueChange={onScoreSelected}
        />
        <h3 className="text-lg font-semibold break-normal">Score</h3>
        <ProgressCircle
          value={scorePercent}
          size="lg"
          color={color}
          className="relative"
        >
          <p className="text-4xl font-semibold text-slate-700">{score}</p>
        </ProgressCircle>
        <div className="flex flex-col gap-3 mb-24">
          <h3 className="text-lg font-semibold break-normal">Hotkeys</h3>
          <div className="flex flex-row gap-2 items-center">
            <ArrowLeftSquareIcon className="text-muted-foreground h-4 w-4" />
            <ArrowRightSquareIcon className="text-muted-foreground h-4 w-4" />
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
    </div>
  );
}

function ConversationView({ span }: { span: any }) {
  const attributes = span?.attributes ? JSON.parse(span.attributes) : {};
  if (!attributes) return null;

  const prompts = attributes["llm.prompts"];
  const responses = attributes["llm.responses"];

  return (
    <div className="flex flex-col gap-12 overflow-y-scroll w-1/2 pr-6">
      {prompts?.length > 0 &&
        JSON.parse(prompts).map((prompt: any, i: number) => (
          <div key={i} className="flex flex-col gap-1">
            <p className="font-semibold text-md capitalize">
              {prompt?.role
                ? prompt?.role === "function"
                  ? `${prompt?.role} - ${prompt?.name}`
                  : prompt?.role
                : "Input"}
              :
              {prompt?.content
                ? " (content)"
                : prompt?.function_call
                ? " (function call)"
                : ""}
            </p>{" "}
            <Markdown className="text-sm">
              {prompt?.content
                ? prompt?.content
                : prompt?.function_call
                ? JSON.stringify(prompt?.function_call)
                : "No input found"}
            </Markdown>
          </div>
        ))}
      {responses?.length > 0 &&
        JSON.parse(responses).map((response: any, i: number) => (
          <div className="flex flex-col gap-1" key={i}>
            <div className="flex gap-2">
              <VendorLogo span={span} />
              <p className="font-semibold text-md capitalize">
                {response?.message?.role || "Output"}:
              </p>{" "}
            </div>
            <Markdown className="text-sm">
              {response?.message?.content ||
                response?.text ||
                response?.content ||
                "No output found"}
            </Markdown>
          </div>
        ))}
    </div>
  );
}
