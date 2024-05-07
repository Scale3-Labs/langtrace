"use client";
import DiffView from "@/components/shared/diff-view";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, InputLarge } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Prompt } from "@prisma/client";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

export default function CreatePromptDialog({
  promptsetId,
  currentPrompt,
  variant = "default",
  disabled = false,
}: {
  promptsetId: string;
  currentPrompt?: Prompt;
  variant?: any;
  disabled?: boolean;
}) {
  const schema = z.object({
    prompt: z.string(),
    note: z.string().optional(),
    live: z.boolean().optional(),
    model: z.string().optional(),
    modelSettings: z.string().optional(),
  });

  const CreatePromptForm = useForm({
    resolver: zodResolver(schema),
  });

  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState<string>(currentPrompt?.value || "");
  const [variables, setVariables] = useState<string[]>(
    currentPrompt?.variables || []
  );
  const [confirmAndSaveView, setConfirmAndSaveView] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  const extractVariables = (prompt: string) => {
    const regex = /{([^}]*)}/g;
    const matches = prompt.match(regex);
    let vars =
      matches?.map((match) => match.replace("{", "").replace("}", "")) || [];
    // remove duplicates
    vars = vars.filter((value, index, self) => self.indexOf(value) === index);
    // remove empty strings
    vars = vars.filter((value) => value !== "");
    // convert all variables to lowercase
    vars = vars.map((variable) => variable.toLowerCase());

    return vars;
  };

  useEffect(() => {
    if (currentPrompt?.value) {
      const vars = extractVariables(currentPrompt.value);
      setVariables(vars);
      setPrompt(currentPrompt.value);
    }
  }, [currentPrompt]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        CreatePromptForm.reset();
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant={variant} disabled={disabled}>
          {currentPrompt ? "Update Prompt" : "Create Prompt"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="min-w-[1200px] min-h-[300px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {confirmAndSaveView ? "Review and Save" : "Create new prompt"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Form {...CreatePromptForm}>
              <form
                className="flex flex-col gap-8"
                onSubmit={CreatePromptForm.handleSubmit(async (data) => {
                  try {
                    setBusy(true);
                    const payload = {
                      value: data.prompt,
                      variables: variables,
                      model: data.model || "",
                      modelSettings: data.modelSettings
                        ? JSON.parse(data.modelSettings)
                        : {},
                      version: currentPrompt?.version
                        ? currentPrompt.version + 1
                        : 1,
                      live: data.live || false,
                      note: data.note || "",
                      promptsetId: promptsetId,
                    };
                    await fetch("/api/prompt", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(payload),
                    });
                    await queryClient.invalidateQueries({
                      queryKey: ["fetch-prompts-query", promptsetId],
                    });
                    toast("Prompt added!", {
                      description: "Your prompt has been added.",
                    });
                    setOpen(false);
                    setBusy(false);
                  } catch (error) {
                    setBusy(false);
                    toast.error("Failed to create prompt");
                  }
                })}
              >
                {!confirmAndSaveView ? (
                  <>
                    <FormField
                      control={CreatePromptForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Prompt{" "}
                            <span className="text-xs font-normal">
                              {
                                "(Variables should be enclosed in curly braces - Ex: {variable})"
                              }
                            </span>
                          </FormLabel>
                          <FormControl>
                            <InputLarge
                              defaultValue={currentPrompt?.value || ""}
                              className="h-32 text-primary"
                              value={field.value}
                              onChange={(e) => {
                                setPrompt(e.target.value);
                                const vars = extractVariables(e.target.value);
                                setVariables(vars);
                                field.onChange(e);
                              }}
                              placeholder="You are a sales assisstant and your name is {name}. You are well versed in {topic}."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-2">
                      <Label>Detected Variables</Label>
                      <div className="flex flex-wrap items-center gap-2 p-2 border-2 border-muted rounded-md h-12">
                        {variables.map((variable) => (
                          <span
                            key={variable}
                            className="bg-primary text-primary-foreground px-2 py-1 rounded-md"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {currentPrompt && (
                      <div className="flex flex-col gap-2">
                        <Label>Diff View</Label>
                        <DiffView
                          oldString={currentPrompt.value as string}
                          newString={prompt}
                        />
                      </div>
                    )}
                    {!currentPrompt && (
                      <div className="flex flex-col gap-2">
                        <Label>Prompt</Label>
                        <p className="p-2 rounded-md border-2 border-muted text-primary">
                          {prompt}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Label>Variables</Label>
                      <div className="flex flex-wrap gap-2 p-2 border-2 border-muted rounded-md min-h-12">
                        {variables.map((variable) => {
                          return (
                            <span
                              key={variable}
                              className={
                                "text-primary-foreground px-2 py-1 rounded-md bg-primary"
                              }
                            >
                              {variable}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex w-full gap-2 items-center justify-between">
                      <FormField
                        defaultValue={currentPrompt?.note || ""}
                        control={CreatePromptForm.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Note (optional)</FormLabel>
                            <FormControl>
                              <InputLarge
                                {...field}
                                className="h-20 text-primary"
                                placeholder="Testing the prompt. Do not approve."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        defaultValue={
                          JSON.stringify(currentPrompt?.modelSettings) || ""
                        }
                        control={CreatePromptForm.control}
                        name="modelSettings"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Model Settings (optional)</FormLabel>
                            <FormControl>
                              <CodeEditor
                                value={field.value}
                                language="json"
                                placeholder='{ "temperature": 0.5 }'
                                onChange={(evn) =>
                                  field.onChange(evn.target.value)
                                }
                                padding={15}
                                className="h-20 rounded-md bg-background dark:bg-background border border-muted text-primary dark:text-primary"
                                style={{
                                  fontFamily:
                                    "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      defaultValue={currentPrompt?.model || ""}
                      control={CreatePromptForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model (optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="text-primary"
                              placeholder="gpt-3.5-turbo"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      defaultValue={currentPrompt?.live || false}
                      control={CreatePromptForm.control}
                      name="live"
                      render={({ field }) => (
                        <FormItem className="flex items-end gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked)
                            }
                          />
                          <FormLabel>
                            Mark as Live
                            <span className="text-xs font-normal">
                              {
                                " (If you are using this prompt in production using the API/SDK, marking this live will ensure that this prompt is used by default for new requests.)"
                              }
                            </span>
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-2">
                      <Label>New Version</Label>
                      <p className="text-primary">
                        {currentPrompt?.version ? currentPrompt.version + 1 : 1}
                      </p>
                    </div>
                  </>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                  {!confirmAndSaveView && (
                    <Button
                      type="submit"
                      onClick={() => {
                        if (prompt === "") {
                          alert("Prompt cannot be empty");
                          return;
                        }
                        setConfirmAndSaveView(true);
                      }}
                    >
                      Continue
                    </Button>
                  )}
                  {confirmAndSaveView && (
                    <Button
                      type="button"
                      variant={"outline"}
                      onClick={() => setConfirmAndSaveView(false)}
                    >
                      Back
                    </Button>
                  )}
                  {confirmAndSaveView && (
                    <Button disabled={busy} type="submit">
                      Save
                    </Button>
                  )}
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
