"use client";

import { CreatePromptset } from "@/components/project/dataset/create";
import { EditPromptSet } from "@/components/project/dataset/edit";
import CardLoading from "@/components/shared/card-skeleton";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RabbitIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { toast } from "sonner";

export default function PromptManagement({ email }: { email: string }) {
  const projectId = useParams()?.project_id as string;

  const {
    data: promptsets,
    isLoading: promptsetsLoading,
    error: promptsetsError,
  } = useQuery({
    queryKey: [`fetch-promptsets-${projectId}-query`],
    queryFn: async () => {
      const response = await fetch(`/api/promptset?id=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch prompt sets");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch prompt sets", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (promptsetsLoading) {
    return <PageLoading />;
  } else if (promptsetsError) {
    return (
      <div className="py-12 px-12 flex flex-col items-center justify-center gap-4 mt-8 w-full">
        <RabbitIcon size={80} />
        <p className="font-semibold">Failed to fetch promptsets</p>
      </div>
    );
  } else {
    return (
      <div className="w-full py-12 px-12 flex flex-col gap-4">
        <div className="w-fit">
          <CreatePromptset projectId={projectId} />
        </div>
        <div className="w-full flex flex-col md:flex-row flex-wrap gap-6 rounded-md">
          {promptsets?.promptsets?.length === 0 && (
            <div className="flex flex-col gap-2 items-center justify-center w-full">
              <p className="text-center font-semibold mt-8">
                Get started by creating your first prompt registry.
              </p>
              <p className="text-center text-sm text-muted-foreground w-1/2">
                A Prompt registry is a collection of versioned prompts all
                related to a single prompt. You can create a prompt registry,
                add a prompt and continue to update and version the prompt. You
                can also access the prompt using the API and use it in your
                application.
              </p>
            </div>
          )}
          {promptsets?.promptsets?.map((promptset: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute top-2 right-2 z-10">
                <EditPromptSet promptset={promptset} />
              </div>
              <Link href={`/project/${projectId}/prompts/${promptset?.id}`}>
                <Card className="w-full md:w-[325px] h-[150px] shadow-md hover:cursor-pointer transition-all duration-200 ease-in-out border-muted hover:border-muted-foreground border-2 hover:shadow-lg hover:bg-muted">
                  <CardHeader>
                    <CardTitle>{promptset?.name}</CardTitle>
                    <CardDescription>
                      <div className="flex flex-col gap-2">
                        <p>{promptset?.description}</p>
                        <p className="font-semibold text-primary">
                          {promptset?._count?.Prompt || 0} versions
                        </p>
                      </div>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

function PageLoading() {
  return (
    <div className="w-full py-12 px-12 flex flex-col gap-4">
      <div className="w-fit">
        <CreatePromptset disabled={true} />
      </div>
      <div
        className={cn(
          "flex w-full gap-12 md:flex-row flex-wrap flex-col md:items-start items-center"
        )}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <CardLoading key={index} />
        ))}
      </div>
    </div>
  );
}
