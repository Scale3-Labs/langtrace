import { HoverCell } from "@/components/shared/hover-cell";
import { LLMView } from "@/components/shared/llm-view";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import detectPII from "@/lib/pii";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { calculatePriceFromUsage, cn, formatDateTime } from "@/lib/utils";
import { Evaluation } from "@prisma/client";
import {
  ArrowTopRightIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "react-query";

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
  page,
  onCheckedChange,
  selectedData,
}: {
  key: number;
  span: any;
  projectId: string;
  testId: string;
  page: number;
  onCheckedChange: (data: CheckedData, checked: boolean) => void;
  selectedData: CheckedData[];
}) {
  const [score, setScore] = useState(-100); // 0: neutral, 1: thumbs up, -1: thumbs down
  const [collapsed, setCollapsed] = useState(true);
  const [evaluation, setEvaluation] = useState<Evaluation>();
  const [addedToDataset, setAddedToDataset] = useState(false);

  useQuery({
    queryKey: ["fetch-evaluation-query", span.span_id, testId],
    queryFn: async () => {
      const response = await fetch(
        `/api/evaluation?spanId=${span.span_id}&testId=${testId}`
      );
      const result = await response.json();
      setEvaluation(result.evaluations.length > 0 ? result.evaluations[0] : {});
      setScore(
        result.evaluations.length > 0 ? result.evaluations[0].ltUserScore : -100
      );
      return result;
    },
  });

  useQuery({
    queryKey: ["fetch-data-query", span.span_id],
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
  const userScore = evaluation?.userScore || "";
  const userId = evaluation?.userId || "";
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
    (responses &&
      detectPII(
        JSON.parse(responses)[0]?.message?.content ||
          JSON.parse(responses)[0]?.text ||
          JSON.parse(responses)[0]?.content ||
          ""
      ).length > 0);

  return (
    <div className="flex flex-col gap-3 w-full" key={key}>
      <div
        className={cn(
          !collapsed ? "border-[1px] border-muted-foreground" : "",
          "grid grid-cols-15 items-center gap-3 py-3 px-4 w-full cursor-pointer"
        )}
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
          <p
            className="text-xs text-muted-foreground font-semibold"
            onClick={() => setCollapsed(!collapsed)}
          >
            {formatDateTime(correctTimestampFormat(span.start_time))}
          </p>
        </div>
        <p className="text-xs font-medium">{model}</p>
        <HoverCell
          className="flex items-center text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
          values={prompts?.length > 0 ? JSON.parse(prompts) : []}
        />
        <HoverCell
          className="flex items-center text-xs h-10 truncate overflow-y-scroll font-semibold col-span-2"
          values={responses?.length > 0 ? JSON.parse(responses) : []}
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
        <p className="text-sm font-semibold">
          {score !== -100 ? score : "Not evaluated"}
        </p>
        <p className="text-sm font-semibold">
          {userScore ? userScore : "Not evaluated"}
        </p>
        <p className="text-sm font-semibold">{userId || "Not Available"}</p>
        <div className=" col-span-2 flex flex-row items-center justify-evenly">
          {addedToDataset ? (
            <CheckCircledIcon className="text-green-600 w-5 h-5" />
          ) : (
            <CrossCircledIcon className="text-muted-foreground w-5 h-5" />
          )}
          <Link href={`/project/${projectId}/evaluate/${testId}?page=${page}`}>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant={"secondary"}
              size={"icon"}
            >
              <ArrowTopRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
      {!collapsed && (
        <LLMView
          responses={[responses]}
          prompts={[prompts]}
          doPiiDetection={true}
        />
      )}
    </div>
  );
}
