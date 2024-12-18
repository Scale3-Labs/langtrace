"use client";

import { MetricAverage } from "@/components/human-evaluations/charts/metric-average";
import { MetricConfidence } from "@/components/human-evaluations/charts/metric-confidence";
import { MetricsTrend } from "@/components/human-evaluations/charts/metrics-trend";
import { CreateTest } from "@/components/human-evaluations/create-test";
import { EditTest } from "@/components/human-evaluations/edit-test";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Test } from "@prisma/client";
import { RabbitIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function Annotations() {
  const projectId = useParams()?.project_id as string;
  const [timeRange, setTimeRange] = useState("365d");
  const [entityType, setEntityType] = useState("session");

  const timeRangeOptions = [
    { value: "365d", label: "Last 12 months" },
    { value: "180d", label: "Last 6 months" },
    { value: "90d", label: "Last 3 months" },
    { value: "30d", label: "Last 30 days" },
    { value: "14d", label: "Last 14 days" },
    { value: "7d", label: "Last 7 days" },
  ];

  const entityTypes = [
    { value: "session", label: "Session" },
    { value: "llm", label: "LLM Inference" },
    { value: "vectordb", label: "VectorDB Retrieval" },
    { value: "framework", label: "Framework API" },
  ];

  const {
    data: tests,
    isLoading: testsLoading,
    error: testsError,
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

      // add it to the front of the result.tests
      result.tests.unshift(
        {
          id: "user_id",
          name: "user ID",
        },
        {
          id: "user_score",
          name: "user score",
        }
      );

      // remove user_id and user_score from result.tests
      result.tests = result.tests.filter(
        (test: Test) => test.id !== "user_id" && test.id !== "user_score"
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

  if (testsError) {
    return (
      <div className="md:px-52 px-12 py-12 flex flex-col items-center justify-center">
        <RabbitIcon size={80} />
        <p className="text-lg font-semibold">
          An error occurred while fetching tests. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="px-10 py-12 flex justify-between bg-muted">
        <h1 className="text-3xl font-semibold">Human Evaluation Metrics</h1>
        <div className="flex gap-2">
          <CreateTest projectId={projectId} variant={"outline"} />
          {tests && tests?.length > 0 && (
            <EditTest projectId={projectId} tests={tests} />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 top-[16rem] w-full px-6 mb-24">
        <h2 className="text-md text-muted-foreground">
          Showing metrics for{" "}
          {entityTypes.find((type) => type.value === entityType)?.label}s over
          the last {timeRange}
        </h2>
        <div className="flex flex-row gap-4 self-end">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 12 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {timeRangeOptions.map((option, index) => (
                <SelectItem
                  key={index}
                  value={option.value}
                  className="rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {entityTypes.map((option, index) => (
                <SelectItem
                  key={index}
                  value={option.value}
                  className="rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <MetricConfidence timeRange={timeRange} entityType={entityType} />
        <MetricAverage
          timeRange={timeRange}
          entityType={entityType}
          metric="average"
        />
        <MetricAverage
          timeRange={timeRange}
          entityType={entityType}
          metric="median"
        />
        <MetricsTrend timeRange={timeRange} entityType={entityType} />
      </div>
    </div>
  );
}
