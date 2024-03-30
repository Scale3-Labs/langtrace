"use client";

import { CreatePrompt } from "@/components/project/dataset/create-data";
import { EditPrompt } from "@/components/project/dataset/edit-data";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";

export default function Promptset() {
  const promptset_id = useParams()?.promptset_id as string;

  const fetchPromptset = useQuery({
    queryKey: [promptset_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/promptset?promptset_id=${promptset_id}`
      );
      const result = await response.json();
      return result;
    },
  });

  if (fetchPromptset.isLoading || !fetchPromptset.data) {
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
            fetchPromptset.data?.promptsets?.Prompt?.map(
              (prompt: any, i: number) => {
                return (
                  <div className="flex flex-col" key={i}>
                    <div className="grid grid-cols-5 items-start justify-stretch gap-3 py-3 px-4">
                      <p className="text-xs">{prompt.createdAt}</p>
                      <p className="text-xs">{prompt.value}</p>
                      <p className="text-xs text-end">{prompt.note}</p>
                      <div className="text-end">
                        <EditPrompt
                          prompt={prompt}
                          promptSetId={promptset_id}
                        />
                      </div>
                    </div>
                    <Separator orientation="horizontal" />
                  </div>
                );
              }
            )}
        </div>
      </div>
    );
  }
}
