import { HoverCell } from "@/components/shared/hover-cell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import detectPII from "@/lib/pii";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { calculatePriceFromUsage, formatDateTime } from "@/lib/utils";
import { Evaluation } from "@prisma/client";
import {
  ArrowTopRightIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";
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
  page,
  onCheckedChange,
  selectedData,
}: {
  key: number;
  span: any;
  projectId: string;
  page: number;
  onCheckedChange: (data: CheckedData, checked: boolean) => void;
  selectedData: CheckedData[];
}) {
  const [score, setScore] = useState(-100); // 0: neutral, 1: thumbs up, -1: thumbs down
  const [evaluation, setEvaluation] = useState<Evaluation>();
  const [addedToDataset, setAddedToDataset] = useState(false);

  useQuery({
    queryKey: ["fetch-evaluation-query", span.span_id],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation?spanId=${span.span_id}`);
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
  model = attributes["llm.model"] || "";
  if (attributes["llm.token.counts"]) {
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
    <tr key={key}>
      <td>
        <div
          className="flex flex-row items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={span.span_id}
            onCheckedChange={(state: boolean) => {
              const input = JSON.parse(prompts).find(
                (prompt: any) => prompt.role === "user"
              );
              if (!input) return;
              let output =
                responses?.length > 0
                  ? JSON.parse(responses)[0]?.message?.content ||
                    JSON.parse(responses)[0]?.text ||
                    JSON.parse(responses)[0]?.content
                  : "";

              // if output is object, convert to string
              if (typeof output === "object") {
                output = JSON.stringify(output);
              }

              const checkedData = {
                spanId: span.span_id,
                input: input?.content || "",
                output: output,
              };
              onCheckedChange(checkedData, state);
            }}
            checked={selectedData.some((d) => d.spanId === span.span_id)}
          />
          <p className="text-xs text-muted-foreground font-semibold">
            {formatDateTime(correctTimestampFormat(span.start_time))}
          </p>
        </div>
      </td>
      <td className="text-xs font-medium">{model}</td>
      <td>
        <HoverCell
          className="h-10 w-48 overflow-hidden truncate text-xs font-semibold"
          values={prompts?.length > 0 ? JSON.parse(prompts) : []}
        />
      </td>
      <td>
        <HoverCell
          className="w-48 overflow-hidden truncate h-10 text-xs font-semibold"
          values={responses?.length > 0 ? JSON.parse(responses) : []}
        />
      </td>
      <td>
        <div className="flex flex-row gap-0 items-center font-semibold">
          {piiDetected ? (
            <DotFilledIcon className="text-red-600 w-6 h-6" />
          ) : (
            <DotFilledIcon className="text-green-600 w-6 h-6" />
          )}
          <p className="text-xs">{piiDetected ? "Yes" : "No"}</p>
        </div>
      </td>
      <td className="text-xs font-semibold text-center">
        {score !== -100 ? score : "Not evaluated"}
      </td>
      <td className="text-xs font-semibold text-center">
        {score !== -100 ? score : "Not evaluated"}
      </td>
      <td className="text-xs font-semibold text-center">
        {score !== -100 ? score : "Not evaluated"}
      </td>
      <td className="text-xs font-semibold text-center">
        {score !== -100 ? score : "Not evaluated"}
      </td>
      <td className="text-xs font-semibold text-center">
        {score !== -100 ? score : "Not evaluated"}
      </td>
      <td className="text-xs font-semibold text-center">
        {userScore ? userScore : "Not evaluated"}
      </td>
      <td className="text-xs font-semibold">{userId || "Not available"}</td>
      <td>
        <div className="flex flex-row items-center justify-evenly">
          {addedToDataset ? (
            <CheckCircledIcon className="text-green-600 w-5 h-5" />
          ) : (
            <CrossCircledIcon className="text-muted-foreground w-5 h-5" />
          )}
          <Link href={`/project/${projectId}/evaluate?page=${page}`}>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant={"secondary"}
              size={"icon"}
            >
              <ArrowTopRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </td>
      {/* {!collapsed && (
        <LLMView
          responses={[responses]}
          prompts={[prompts]}
          doPiiDetection={true}
        />
      )} */}
    </tr>
  );
}
