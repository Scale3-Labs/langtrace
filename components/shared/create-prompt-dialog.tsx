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
import { zodResolver } from "@hookform/resolvers/zod";
import { Prompt } from "@prisma/client";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Badge } from "../ui/badge";

export default function CreatePromptDialog({
  promptsetId,
  currentPrompt,
  version,
  passedPrompt,
  variant = "default",
  disabled = false,
  open,
  setOpen,
  showButton = true,
  setOpenDialog,
}: {
  promptsetId: string;
  currentPrompt?: Prompt & {
    originalZodSchema: string | null;
  };
  passedPrompt?: string;
  version?: number;
  variant?: any;
  disabled?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  showButton?: boolean;
  setOpenDialog?: (open: boolean) => void;
}) {
  const schema = z.object({
    prompt: z.string(),
    originalZodSchema: z.string().optional(),
    note: z.string().optional(),
    live: z.boolean().optional(),
    model: z.string().optional(),
    modelSettings: z.string().optional(),
  });

  const isZodSchema = (str: string): boolean => {
    try {
      // Check for basic Zod patterns
      if (!/z\./.test(str)) return false;

      // Enhanced regex to detect complex Zod schemas with validation rules
      const zodPatterns = [
        /z\.(object|string|number|array|boolean|enum|union|discriminatedUnion|intersection|tuple|record|map|set|function|lazy|promise|null|undefined|any|unknown|void|never|literal|nan|symbol)/,
        /\.(min|max|email|url|uuid|cuid|length|startsWith|endsWith|includes|regex|optional|nullable|array|object)\(/,
        /z\.object\(\{[\s\S]*\}\)/  // Match object structure
      ];

      if (!zodPatterns.some(pattern => pattern.test(str))) return false;

      // Validate the schema by evaluating it
      const schema = new Function("z", `return ${str}`)(z);
      return schema !== undefined && typeof schema.parse === 'function';
    } catch {
      return false;
    }
  };

  const [isZod, setIsZod] = useState(() => {
    const hasOriginalZod = currentPrompt?.originalZodSchema !== null && currentPrompt?.originalZodSchema !== undefined;
    const currentValueIsZod = currentPrompt?.value && isZodSchema(currentPrompt.value);
    return hasOriginalZod || currentValueIsZod;
  });

  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<boolean>(false);
  const [variables, setVariables] = useState<string[]>(currentPrompt?.variables || []);
  const [viewFormat, setViewFormat] = useState<"json" | "zod">("json");

  // Add button for toggling view format
  const ViewFormatButton = () => (
    isZod && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setViewFormat(viewFormat === "json" ? "zod" : "json")}
      >
        View as {viewFormat === "json" ? "Zod" : "JSON"}
      </Button>
    )
  );

  const CreatePromptForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: currentPrompt?.value || "",
      note: currentPrompt?.note || "",
      modelSettings: JSON.stringify(currentPrompt?.modelSettings || {}),
      model: currentPrompt?.model || "",
      live: currentPrompt?.live || false,
    },
  });

  // Initialize isZod state based on current prompt
  useEffect(() => {
    const promptValue = currentPrompt?.value || "";
    const isZodValue = isZodSchema(promptValue);
    setIsZod(isZodValue);
    if (isZodValue) {
      setViewFormat("zod");
    }
  }, [currentPrompt]);

  // Update form values when currentPrompt changes
  useEffect(() => {
    if (currentPrompt) {
      const isCurrentZod = currentPrompt.originalZodSchema !== null && currentPrompt.originalZodSchema !== undefined;
      const promptValue = isCurrentZod
        ? currentPrompt.originalZodSchema
        : currentPrompt.value;

      // Enhanced Zod detection - check both original schema and current value
      const isZodValue = Boolean(isCurrentZod || (promptValue && isZodSchema(promptValue)));

      // Set form values
      CreatePromptForm.reset({
        prompt: promptValue || "",
        note: currentPrompt.note || "",
        live: currentPrompt.live || false,
        model: currentPrompt.model || "",
        modelSettings: JSON.stringify(currentPrompt.modelSettings) || "",
      });

      // Update state while preserving Zod format when applicable
      setIsZod(isZodValue);
      if (isZodValue) {
        setViewFormat("zod"); // Always default to Zod view for Zod schemas
      }
      setVariables(currentPrompt.variables || []);
    }
  }, [currentPrompt]);

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
            const currentValue = CreatePromptForm.getValues("prompt");
            const isZodValue = isZodSchema(currentValue);
            setIsZod(isZodValue);
            setViewFormat(isZodValue ? "zod" : "json");
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
              {currentPrompt ? "Create New Version" : "Create Prompt"}
            </Button>
          )}
        </AlertDialogTrigger>
        <AlertDialogContent className="min-w-[1000px] h-[80vh] overflow-y-scroll">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentPrompt ? "Create New Version" : "Create new prompt"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Form {...CreatePromptForm}>
                <form
                  className="flex flex-col gap-8"
                  onSubmit={CreatePromptForm.handleSubmit(async (data) => {
                    try {
                      setBusy(true);
                      let serializedPrompt;
                      let originalZodSchema = null;

                      // Handle Zod schema preservation
                      if (isZod) {
                        originalZodSchema = data.prompt;
                        try {
                          const schema = new Function("z", `return ${data.prompt}`)(z);
                          serializedPrompt = JSON.stringify(zodToJsonSchema(schema));
                        } catch (e) {
                          console.error("Error converting Zod to JSON:", e);
                          toast.error("Invalid Zod schema");
                          return;
                        }
                      } else {
                        serializedPrompt = data.prompt;
                      }

                      const payload = {
                        value: serializedPrompt,
                        originalZodSchema,
                        variables: variables,
                        model: data.model || "",
                        modelSettings: data.modelSettings ? JSON.parse(data.modelSettings) : {},
                        version: currentPrompt ? (currentPrompt.version || 0) + 1 : 1,
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
                      // Reset form
                      CreatePromptForm.reset();

                      toast(currentPrompt ? "New version created!" : "Prompt created!", {
                        description: currentPrompt
                          ? `Version ${payload.version} of your prompt has been created.`
                          : "Version 1 of your prompt has been created.",
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
                        <FormLabel className="flex items-center justify-between">
                          <div>
                            Prompt{" "}
                            <span className="text-xs font-normal">
                              {
                                "(Variables should be enclosed in curly braces - Ex: ${variable})"
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {(isZod || isZodSchema(CreatePromptForm.watch("prompt"))) && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewFormat(viewFormat === "json" ? "zod" : "json")}
                                >
                                  View as {viewFormat === "json" ? "Zod" : "JSON"}
                                </Button>
                                <Badge variant="default">Zod Schema</Badge>
                              </>
                            )}
                          </div>
                        </FormLabel>
                        <FormControl>
                          <CodeEditor
                            value={
                              isZod
                                ? viewFormat === "json"
                                  ? (() => {
                                      try {
                                        const schema = new Function(
                                          "z",
                                          `return ${CreatePromptForm.watch("prompt")}`
                                        )(z);
                                        return JSON.stringify(
                                          zodToJsonSchema(schema),
                                          null,
                                          2
                                        );
                                      } catch (e) {
                                        console.error("Error converting Zod to JSON:", e);
                                        return CreatePromptForm.watch("prompt");
                                      }
                                    })()
                                  : CreatePromptForm.watch("prompt")
                                : isJsonString(CreatePromptForm.watch("prompt"))
                                ? JSON.stringify(JSON.parse(CreatePromptForm.watch("prompt")), null, 2)
                                : CreatePromptForm.watch("prompt")
                            }
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              try {
                                const newValue = e.target.value;
                                const isZodValue = isZodSchema(newValue);

                                setIsZod(isZodValue);
                                if (isZodValue !== isZod) {
                                  setViewFormat(isZodValue ? "zod" : "json");
                                }

                                if (isZodValue) {
                                  field.onChange(newValue);
                                } else {
                                  field.onChange(
                                    isJsonString(newValue)
                                      ? JSON.stringify(JSON.parse(newValue), null, 2)
                                      : newValue
                                  );
                                }

                                const vars = extractVariables(newValue);
                                setVariables(vars);
                              } catch (error) {
                                console.error("Error processing input:", error);
                                field.onChange(e.target.value);
                              }
                            }}
                            placeholder={
                              viewFormat === "zod"
                                ? 'z.object({\n  name: z.string(),\n  age: z.number(),\n  email: z.string().email()\n})'
                                : '{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number" }\n  }\n}'
                            }
                            language={viewFormat === "json" ? "json" : "typescript"}
                            padding={15}
                            className="rounded-md bg-background dark:bg-background border border-muted text-primary dark:text-primary"
                            style={{
                              fontFamily:
                                "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                            } as React.CSSProperties}
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
                    <Label>Current Version</Label>
                    <p className="text-primary">
                      {currentPrompt ? `Version ${currentPrompt.version}` : "Version 1"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Creating Version {currentPrompt ? currentPrompt.version + 1 : 1}
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
