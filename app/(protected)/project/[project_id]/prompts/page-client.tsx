"use client";

import { AddtoPromptset } from "@/components/shared/add-to-promptset";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PAGE_SIZE } from "@/lib/constants";
import { extractPromptFromLlmInputs } from "@/lib/utils";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import Markdown from "react-markdown";
import { useQuery } from "react-query";

interface CheckedData {
  value: string;
  spanId: string;
}

export default function PageClient({ email }: { email: string }) {
  const project_id = useParams()?.project_id as string;
  const [selectedData, setSelectedData] = useState<CheckedData[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showLoader, setShowLoader] = useState(false);
  const [currentData, setCurrentData] = useState<any>([]);

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
        `/api/prompt?projectId=${project_id}&page=${page}&pageSize=${PAGE_SIZE}`
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Get the newly fetched data and metadata
      const newData = data?.prompts?.result || [];
      const metadata = data?.prompts?.metadata || {};

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
    if (fetchPrompts.isRefetching) {
      return;
    }
    if (page <= totalPages) {
      setShowLoader(true);
      fetchPrompts.refetch();
    }
  });

  if (fetchPrompts.isLoading || !fetchPrompts.data || !currentData) {
    return <div>Loading...</div>;
  } else {
    // Deduplicate prompts
    const seenPrompts: string[] = [];
    const prompts = currentData || [];
    const dedupedPrompts = prompts.filter((prompt: any) => {
      const attributes = prompt.attributes ? JSON.parse(prompt.attributes) : {};
      const prompts: any[] = JSON.parse(attributes["llm.prompts"]) || "[]";
      const promptContent = extractPromptFromLlmInputs(prompts);
      if (promptContent.length === 0) {
        return false;
      }

      if (seenPrompts.includes(promptContent)) {
        return false;
      } else {
        seenPrompts.push(promptContent);
        return true;
      }
    });

    return (
      <div className="w-full py-6 px-6 flex flex-col gap-4">
        <div className="w-fit">
          <AddtoPromptset projectId={project_id} selectedData={selectedData} />
        </div>
        <p className="text-sm font-semibold text-black bg-yellow-300 px-2 p-1 rounded-md">
          These prompts are automatically captured from your traces. The
          accuracy of these prompts are calculated based on the evaluation done
          in the evaluate tab.
        </p>
        <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
          <div className="grid grid-cols-6 items-center justify-stretch gap-3 py-3 px-4 bg-muted">
            <p className="text-xs font-medium">LLM Vendor</p>
            <p className="text-xs font-medium text-left">Model</p>
            <p className="text-xs font-medium text-left">Interactions</p>
            <p className="text-xs text-left font-medium">Prompt</p>
            <p className="text-xs font-medium text-center">Accuracy</p>
            <p className="text-xs font-medium">Added to Dataset</p>
          </div>
          {dedupedPrompts.map((prompt: any, i: number) => {
            return (
              <PromptRow
                key={i}
                prompt={prompt}
                onCheckedChange={onCheckedChange}
                selectedData={selectedData}
              />
            );
          })}
          {showLoader && (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-center" />
            </div>
          )}
          {dedupedPrompts?.length === 0 && (
            <div className="flex flex-col gap-3 items-center justify-center p-4">
              <p className="text-muted-foreground font-semibold text-md mb-3">
                No prompts available. Use the system role with your LLM API
                calls to capture prompts automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

const PromptRow = ({
  prompt,
  onCheckedChange,
  selectedData,
}: {
  prompt: any;
  onCheckedChange: any;
  selectedData: CheckedData[];
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [accuracy, setAccuracy] = useState(0);
  const [addedToPromptset, setAddedToPromptset] = useState(false);

  useQuery({
    queryKey: [`fetch-promptdata-query-${prompt.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/promptdata?spanId=${prompt.span_id}`);
      const result = await response.json();
      setAddedToPromptset(result.data.length > 0);
      return result;
    },
  });

  // Get the evaluation for this prompt's content
  const attributes = prompt.attributes ? JSON.parse(prompt.attributes) : {};
  const prompts: any[] = JSON.parse(attributes["llm.prompts"]) || "[]";
  const promptContent = extractPromptFromLlmInputs(prompts);

  const fetchEvaluation = useQuery({
    queryKey: [`fetch-evaluation-query-${prompt.span_id}`],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation?prompt=${promptContent}`);
      const result = await response.json();

      // calculate accuracy
      let score = 0;
      result.evaluations.forEach((e: any) => {
        if (e.score !== null && e.score !== undefined && e.score === 1) {
          score += 1;
        }
      });
      setAccuracy((score * 100) / result.evaluations.length);

      return result;
    },
  });

  if (!attributes || promptContent.length === 0) {
    return null;
  }

  let model = "";
  let vendor = "";
  if (attributes["llm.token.counts"]) {
    model = attributes["llm.model"];
    vendor = attributes["langtrace.service.name"];
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid grid-cols-6 justify-stretch items-center py-1 px-4 w-full cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          className="flex flex-row items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={prompt.span_id}
            onCheckedChange={(state) => {
              const checkedData = {
                spanId: prompt.span_id,
                value: promptContent,
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
          <p className="text-xs text-muted-foreground text-center font-semibold">
            {vendor}
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-left font-semibold">
          {model}
        </p>
        <p className="text-xs text-left font-semibold">
          {fetchEvaluation.data?.evaluations?.length}
        </p>
        <p className="text-xs text-left h-10 truncate overflow-y-scroll font-semibold">
          {promptContent}
        </p>
        <p className="text-xs text-center font-semibold">
          {accuracy?.toFixed(2)}%
        </p>
        {addedToPromptset ? (
          <CheckCircledIcon className="text-green-600 w-5 h-5" />
        ) : (
          ""
        )}
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-6 p-4 border-[1px] border-muted-foreground rounded-md">
          {promptContent?.length > 0 && (
            <p className="text-xs bg-muted w-fit p-1 rounded-md leading-6">
              <Markdown>{promptContent || ""}</Markdown>
            </p>
          )}
        </div>
      )}
      <Separator orientation="horizontal" />
    </div>
  );
};
