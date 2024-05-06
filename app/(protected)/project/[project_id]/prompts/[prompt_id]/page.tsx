"use client";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { useState } from "react";

const prompts: any[] = [];

export default function Prompt() {
  const [selectedPrompt, setSelectedPrompt] = useState(
    prompts.length > 0 ? prompts[0] : null
  );
  if (!selectedPrompt)
    return (
      <div className="p-12 flex items-center justify-center">
        No prompts found :(
      </div>
    );
  else
    return (
      <div className="px-12 py-12 flex flex-col gap-4">
        <div className="flex gap-4 w-full h-screen">
          <div className="flex flex-col gap-2 border-2 border-muted rounded-md w-[340px] p-2 overflow-y-scroll">
            {prompts.map((prompt, i) => (
              <div
                onClick={() => setSelectedPrompt(prompt)}
                className={cn(
                  "flex gap-4 items-start w-full rounded-md p-2 hover:bg-muted cursor-pointer",
                  selectedPrompt.id === prompt.id ? "bg-muted" : ""
                )}
                key={prompt.id}
              >
                <div className="flex items-center flex-col gap-2">
                  <div className="rounded-full w-[10px] flex items-center justify-center break-normal px-6 py-3 text-xs border-2 border-muted-foreground">
                    {prompt.version}
                  </div>
                  <Separator
                    className="h-8 bg-muted-foreground"
                    orientation="vertical"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <p
                    className={cn(
                      "text-white text-xs p-1 rounded-md w-fit",
                      prompt.approved ? "bg-green-500" : "bg-orange-500"
                    )}
                  >
                    {prompt.approved ? "Approved" : "Pending"}
                  </p>
                  <p className="text-sm">
                    {prompt.note || `Version ${prompt.version}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-2">
              <Label>Prompt</Label>
              <p className="p-2 rounded-md border-2 border-muted">
                {selectedPrompt.prompt}
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
              <p className="p-2 rounded-md border-2 border-muted text-sm font-semibold">
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
          </div>
        </div>
      </div>
    );
}
