"use client";
import CreatePromptDialog from "@/components/shared/create-prompt-dialog";
import HowTo from "@/components/shared/how-to";
import { PromptInstructions } from "@/components/shared/setup-instructions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Prompt } from "@prisma/client";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";

export default function Page() {
  const promptsetId = useParams()?.prompt_id as string;
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt>();
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [live, setLive] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { isLoading: promptsLoading, error: promptsError } = useQuery({
    queryKey: ["fetch-prompts-query", promptsetId],
    queryFn: async () => {
      const response = await fetch(
        `/api/promptset?promptset_id=${promptsetId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch tests");
      }
      const result = await response.json();
      setPrompts(result?.promptsets?.prompts || []);
      if (result?.promptsets?.prompts.length > 0 && !selectedPrompt) {
        setSelectedPrompt(result?.promptsets?.prompts[0]);
        setLive(result?.promptsets?.prompts[0].live);
      }
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch prompts", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (promptsLoading) return <PageLoading />;

  if (!selectedPrompt)
    return (
      <div className="p-12 flex flex-col gap-2">
        <HowTo link="https://docs.langtrace.ai/features/manage_prompts" />
        <Button
          className="w-fit"
          variant={"outline"}
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-6 h-6 mr-2" />
          Back
        </Button>
        <div className="flex flex-col gap-2 items-center justify-center">
          <p className="font-semibold text-lg">Create your first prompt</p>
          <p className="text-muted-foreground text-sm text-center w-1/3">
            Start by creating the first version of your prompt. Once created,
            you can test it in the playground with different models and model
            settings and continue to iterate and add more versions to the
            prompt.
          </p>
          <CreatePromptDialog
            promptsetId={promptsetId}
            version={prompts.length + 1}
            open={createDialogOpen}
            setOpen={setCreateDialogOpen}
          />
        </div>
      </div>
    );
  else
    return (
      <div className="px-12 py-12 flex flex-col gap-4">
        <HowTo link="https://docs.langtrace.ai/features/manage_prompts" />
        <div className="flex gap-4 items-center">
          <Button
            className="w-fit"
            variant={"outline"}
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-6 h-6 mr-2" />
            Back
          </Button>
          {prompts.length > 0 ? (
            <CreatePromptDialog
              currentPrompt={selectedPrompt}
              promptsetId={promptsetId}
              version={prompts.length + 1}
              open={createDialogOpen}
              setOpen={setCreateDialogOpen}
            />
          ) : (
            <CreatePromptDialog
              promptsetId={promptsetId}
              version={prompts.length + 1}
              open={createDialogOpen}
              setOpen={setCreateDialogOpen}
            />
          )}
        </div>
        <div className="flex gap-4 w-full h-screen">
          <div className="flex flex-col gap-2 border-2 border-muted rounded-md w-[340px] p-2 overflow-y-scroll">
            {prompts.map((prompt: Prompt, i) => (
              <div
                onClick={() => {
                  setSelectedPrompt(prompt);
                  setLive(prompt.live);
                }}
                className={cn(
                  "flex gap-4 items-start w-full rounded-md p-2 hover:bg-muted cursor-pointer",
                  selectedPrompt.id === prompt.id ? "bg-muted" : ""
                )}
                key={prompt.id}
              >
                <div className="flex items-center flex-col gap-2">
                  <div className="bg-muted font-semibold shadow-md rounded-full w-[10px] flex items-center justify-center break-normal px-6 py-3 text-xs border-2 border-muted-foreground">
                    v{prompt.version}
                  </div>
                  <Separator
                    className="h-8 w-[4px] rounded-md bg-muted-foreground"
                    orientation="vertical"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {prompt.live && (
                    <p
                      className={cn(
                        "text-white font-semibold text-xs p-1 rounded-md w-fit bg-green-500"
                      )}
                    >
                      Live
                    </p>
                  )}
                  <p className="text-sm">
                    {prompt.note || `Version ${prompt.version}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-2">
              <Label>Go Live</Label>
              <div className="flex items-center gap-2 w-fit">
                <Switch
                  checked={live}
                  onCheckedChange={async (checked) => {
                    setLive(checked as boolean);
                    try {
                      const payload = {
                        ...selectedPrompt,
                        live: checked,
                      };
                      await fetch("/api/prompt", {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["fetch-prompts-query", promptsetId],
                      });
                      toast.success(
                        checked
                          ? "This prompt is now live"
                          : "This prompt is no longer live. Make sure to make another prompt live"
                      );
                    } catch (error) {
                      toast.error("Failed to make prompt live", {
                        description:
                          error instanceof Error
                            ? error.message
                            : String(error),
                      });
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Make this version of the prompt live
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Prompt Registry ID</Label>
              <p className="p-2 rounded-md border-2 border-muted font-semibold text-md">
                {promptsetId}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Prompt</Label>
              <p className="p-2 rounded-md border-2 border-muted">
                {selectedPrompt.value}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Variables</Label>
              <div className="flex flex-wrap gap-2 p-4 border-2 border-muted rounded-md">
                {selectedPrompt.variables.map((variable: string) => (
                  <span
                    key={variable}
                    className="bg-primary text-sm text-primary-foreground px-2 py-1 rounded-md"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Model</Label>
              <p className="p-2 rounded-md border-2 border-muted text-sm font-semibold h-10">
                {selectedPrompt.model ?? "None"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Model Settings</Label>
              <CodeEditor
                readOnly
                value={JSON.stringify(selectedPrompt.modelSettings) || "{}"}
                language="json"
                padding={15}
                className="rounded-md bg-background dark:bg-background border border-muted text-primary dark:text-primary"
                style={{
                  fontFamily:
                    "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Use the Live prompt directly in your code</Label>
              <PromptInstructions id={promptsetId} />
            </div>
          </div>
        </div>
      </div>
    );
}

function PageLoading() {
  return (
    <div className="px-12 py-12 flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <Button className="w-fit" variant={"outline"} disabled={true}>
          <ChevronLeft className="w-6 h-6 mr-2" />
          Back
        </Button>
      </div>
      <div className="flex gap-4 w-full h-screen">
        <Skeleton className="w-[340px] h-screen" />
        <Skeleton className="w-full h-screen" />
      </div>
    </div>
  );
}
