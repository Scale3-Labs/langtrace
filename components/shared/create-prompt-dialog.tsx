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
import { cn, isJsonString } from "@/lib/utils";
import { jsonToZodSchema, isJsonSchema } from "@/lib/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Badge } from "../ui/badge";

export default function CreatePromptDialog({
  promptsetId,
  currentPrompt,
  passedPrompt,
  variant = "default",
  disabled = false,
  open,
  setOpen,
  showButton = true,
  setOpenDialog,
}: {
  promptsetId: string;
  currentPrompt?: {
    id: string;
    value: string;
    isZodSchema?: boolean;
    name?: string;
    note?: string;
    live?: boolean;
    model?: string;
    modelSettings?: Record<string, any>;
    variables?: string[];
    version?: number;
  };
  passedPrompt?: string;
  variant?: any;
  disabled?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  showButton?: boolean;
  setOpenDialog?: (open: boolean) => void;
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
    defaultValues: {
      prompt: passedPrompt || currentPrompt?.value || "",
      note: currentPrompt?.note || "",
      live: currentPrompt?.live || false,
      model: currentPrompt?.model || "",
      modelSettings: JSON.stringify(currentPrompt?.modelSettings) || "",
    },
  });

  const queryClient = useQueryClient();
  const [variables, setVariables] = useState<string[]>(
    currentPrompt?.variables || []
  );
  const [busy, setBusy] = useState<boolean>(false);
  const [isZod, setIsZod] = useState<boolean>(currentPrompt?.isZodSchema || false);
  const [showAsZod, setShowAsZod] = useState<boolean>(currentPrompt?.isZodSchema || false);

  const isZodSchema = (str: string) => {
    return (
      /z\./.test(str) &&
      /z\.(object|string|number|array|discriminatedUnion)/.test(str)
    );
  };

  const extractVariables = (prompt: string) => {
    const regex = /\$\{([^}]*)\}/g;
    const matches = prompt.match(regex);
    let vars =
      matches?.map((match) => match.replace("${", "").replace("}", "")) || [];
    // remove duplicates
    vars = vars.filter((value, index, self) => self.indexOf(value) === index);
    // remove empty strings
    vars = vars.filter((value) => value !== "");
    // convert all variables to lowercase
    vars = vars.map((variable) => variable.toLowerCase());

    return vars;
  };

  const handleRemoveVariable = (variableToRemove: string) => {
    setVariables((prevVariables) =>
      prevVariables.filter((variable) => variable !== variableToRemove)
    );
  };

  return (
    <>
      <AlertDialog
        open={open}
        onOpenChange={(val) => {
          if (!val) {
            setOpen(val);
            CreatePromptForm.reset();
          }
        }}
      >
        <AlertDialogTrigger asChild>
          {showButton && (
            <Button
              variant={variant}
              disabled={disabled}
              onClick={() => setOpen(true)}
            >
              {currentPrompt ? "Update Prompt" : "Create Prompt"}
            </Button>
          )}
        </AlertDialogTrigger>
        <AlertDialogContent className="min-w-[1000px] h-[80vh] overflow-y-scroll">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentPrompt ? "Review and Save" : "Create new prompt"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Form {...CreatePromptForm}>
                <form
                  className="flex flex-col gap-8"
                  onSubmit={CreatePromptForm.handleSubmit(async (data) => {
                    try {
                      setBusy(true);

                      // if the prompt is a zod schema, we serialize it as a string
                      let serializedPrompt;
                      if (isZod) {
                        const createSchema = new Function(
                          "z",
                          `return ${data.prompt}`
                        );
                        const schema = createSchema(z);
                        serializedPrompt = JSON.stringify(
                          zodToJsonSchema(schema)
                        );
                      } else {
                        serializedPrompt = data.prompt;
                      }

                      const payload = {
                        value: serializedPrompt,
                        variables: variables,
                        model: data.model || "",
                        modelSettings: data.modelSettings
                          ? JSON.parse(data.modelSettings)
                          : {},
                        version: currentPrompt?.version ? currentPrompt.version + 1 : 1,
                        live: data.live || false,
                        note: data.note || "",
                        promptsetId: promptsetId,
                        isZodSchema: isZod
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
                      // Reset form
                      CreatePromptForm.reset();

                      toast("Prompt added!", {
                        description: "Your prompt has been added.",
                      });
                      setBusy(false);
                      setOpen(false);
                      setOpenDialog && setOpenDialog(false);
                    } catch (error: any) {
                      setBusy(false);
                      toast.error(
                        "Failed to create prompt. Please check your prompt!",
                        {
                          description: error?.message || "An error occurred",
                        }
                      );
                    }
                  })}
                >
                  <FormField
                    control={CreatePromptForm.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Prompt{" "}
                          <span className="text-xs font-normal">
                            {isZod
                              ? "(Enter Zod schema or toggle to view as JSON)"
                              : "(Variables should be enclosed in curly braces - Ex: ${variable})"
                            }
                          </span>
                          {isZod && (
                            <>
                              <Badge className="ml-2" variant="default">
                                Zod Schema
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="ml-2"
                                onClick={() => setShowAsZod(!showAsZod)}
                              >
                                View as {showAsZod ? "JSON" : "Zod"}
                              </Button>
                            </>
                          )}
                        </FormLabel>
                        <FormControl>
                          <CodeEditor
                            defaultValue={
                              currentPrompt?.isZodSchema
                                ? showAsZod
                                  ? currentPrompt.value
                                  : (() => {
                                      try {
                                        const createSchema = new Function(
                                          "z",
                                          `return ${currentPrompt.value}`
                                        );
                                        const schema = createSchema(z);
                                        return JSON.stringify(zodToJsonSchema(schema), null, 2);
                                      } catch (error) {
                                        console.error('Error converting Zod to JSON schema:', error);
                                        return currentPrompt.value;
                                      }
                                    })()
                                : isJsonString(
                                    passedPrompt || currentPrompt?.value || ""
                                  )
                                ? JSON.stringify(
                                    JSON.parse(
                                      passedPrompt || currentPrompt?.value || ""
                                    ),
                                    null,
                                    2
                                  )
                                : passedPrompt || currentPrompt?.value || ""
                            }
                            value={
                              isZod
                                ? showAsZod
                                  ? field.value
                                  : (() => {
                                      try {
                                        const createSchema = new Function(
                                          "z",
                                          `return ${field.value}`
                                        );
                                        const schema = createSchema(z);
                                        return JSON.stringify(zodToJsonSchema(schema), null, 2);
                                      } catch (error) {
                                        console.error('Error converting Zod to JSON schema:', error);
                                        return field.value;
                                      }
                                    })()
                                : isJsonString(field.value)
                                  ? JSON.stringify(JSON.parse(field.value), null, 2)
                                  : field.value
                            }
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (isZodSchema(newValue)) {
                                setIsZod(true);
                                setShowAsZod(true);
                                field.onChange(newValue);
                              } else if (isJsonString(newValue) && !showAsZod) {
                                field.onChange(newValue);
                              } else {
                                setIsZod(false);
                                const vars = extractVariables(newValue);
                                setVariables(vars);
                                field.onChange(newValue);
                              }
                            }}
                            placeholder="You are a sales assisstant and your name is ${name}. You are well versed in ${topic}."
                            language={isZod ? (showAsZod ? "typescript" : "json") : "json"}
                            padding={15}
                            className="rounded-md bg-background dark:bg-background border border-muted text-primary dark:text-primary"
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
                  <div className="flex flex-col gap-2">
                    <Label>Detected Variables</Label>
                    <div className="flex flex-wrap items-center gap-2 p-2 border-2 border-muted rounded-md h-12">
                      {variables.map((variable) => (
                        <div
                          key={variable}
                          className="flex items-center bg-primary text-primary-foreground px-2 py-1 rounded-md"
                        >
                          <span>{variable}</span>
                          <X
                            className="ml-2 cursor-pointer"
                            size={16}
                            onClick={() => handleRemoveVariable(variable)}
                          />
                        </div>
                      ))}
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
                      <FormItem
                        className={cn(
                          "font-semibold p-1 rounded-md text-primary flex items-end gap-2",
                          field.value ? "bg-green-300" : "bg-orange-300"
                        )}
                      >
                        <Checkbox
                          id="live"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                        <FormLabel
                          htmlFor="live"
                          className="font-semibold text-primary cursor-pointer"
                        >
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
                      {currentPrompt?.version
                        ? `Version ${currentPrompt.version + 1}`
                        : "Version 1"}
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <Button disabled={busy} type="submit">
                      Save
                    </Button>
                  </AlertDialogFooter>
                </form>
              </Form>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
