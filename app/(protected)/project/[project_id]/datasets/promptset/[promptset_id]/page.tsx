"use client";

import { CreatePrompt } from "@/components/project/dataset/create-data";
import { EditPrompt } from "@/components/project/dataset/edit-data";
import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PAGE_SIZE } from "@/lib/constants";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useQuery } from "react-query";

export default function Promptset() {
  const promptset_id = useParams()?.promptset_id as string;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(2);
  const [showLoader, setShowLoader] = useState(false);
  const [data, setData] = useState<any>(null);

  useBottomScrollListener(() => {
    if (fetchPromptset.isRefetching) {
      return;
    }
    if (page < totalPages) {
      setShowLoader(true);
      fetchPromptset.refetch();
    }
  });

  const fetchPromptset = useQuery({
    queryKey: [promptset_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/promptset?promptset_id=${promptset_id}&page=${page}&pageSize=${PAGE_SIZE}`
      );
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      if (totalPages !== result?.metadata?.total_pages) {
        setTotalPages(result?.metadata?.total_pages);
      }
      if (result) {
        const newData = result?.promptsets?.Prompt || [];
        if (data) {
          const updatedData = [
            ...data,
            ...newData.filter(
              (newItem: any) =>
                !data.some(
                  (existingItem: any) => existingItem.id === newItem.id
                )
            ),
          ];
          setData(updatedData);
        } else {
          setData(result.promptsets.Prompt);
        }
      }
      setPage((currentPage) => currentPage + 1);
      setShowLoader(false);
    },
    refetchOnWindowFocus: false,
  });

  if (fetchPromptset.isLoading || !fetchPromptset.data || !data) {
    return <div>Loading...</div>;
  } else {
    return (
      <div className="w-full py-6 px-6 flex flex-col gap-4">
        <div className="flex gap-4 items-center w-fit">
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ChevronLeft className="mr-1" />
            Back
          </Button>
          <CreatePrompt promptsetId={promptset_id} />
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-muted max-h-screen overflow-y-scroll">
          <div className="grid grid-cols-4 items-center justify-stretch gap-3 py-3 px-4 bg-muted">
            <p className="text-xs font-medium">Created at</p>
            <p className="text-xs font-medium">Value</p>
            <p className="text-xs font-medium text-left">Note</p>
            <p className="text-xs font-medium text-end"></p>
          </div>
          {fetchPromptset.data?.promptsets &&
            fetchPromptset.data?.promptsets?.Prompt?.length === 0 && (
              <div className="flex items-center justify-center">
                <p className="text-muted-foreground">
                  No prompts found in this promptset
                </p>
              </div>
            )}
          {fetchPromptset.data?.promptsets &&
            data.map((prompt: any, i: number) => {
              return (
                <div className="flex flex-col" key={i}>
                  <div className="grid grid-cols-5 items-start justify-stretch gap-3 py-3 px-4">
                    <p className="text-xs">{prompt.createdAt}</p>
                    <p className="text-xs">{prompt.value}</p>
                    <p className="text-xs text-end">{prompt.note}</p>
                    <div className="text-end">
                      <EditPrompt prompt={prompt} promptSetId={promptset_id} />
                    </div>
                  </div>
                  <Separator orientation="horizontal" />
                </div>
              );
            })}
          {showLoader && (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-center" />
            </div>
          )}
        </div>
      </div>
    );
  }
}
