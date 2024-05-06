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
import { InputLarge } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function CreatePromptDialog({
  currentPrompt,
  currentVersion,
  variant = "default",
}: {
  currentPrompt?: string;
  currentVersion?: number;
  variant?: any;
}) {
  const schema = z.object({
    prompt: z.string(),
    note: z.string().optional(),
    approved: z.boolean().optional(),
  });

  const CreatePromptForm = useForm({
    resolver: zodResolver(schema),
  });

  const [prompt, setPrompt] = useState<string>("");
  const [variables, setVariables] = useState<string[]>([]);
  const [confirmAndSaveView, setConfirmAndSaveView] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

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

  let currentVariables: string[] = [];
  if (currentPrompt) {
    currentVariables = extractVariables(currentPrompt);
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant}>Create Prompt</Button>
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
                onSubmit={CreatePromptForm.handleSubmit((data) => {
                  console.log("data");
                  console.log(data);
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
                      <div className="flex flex-wrap gap-2 p-2 border-2 border-muted rounded-md">
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
                          oldString={currentPrompt as string}
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
                      <div className="flex flex-wrap gap-2 p-2 border-2 border-muted rounded-md">
                        {currentVariables.map((variable) => {
                          return (
                            <span
                              key={variable}
                              className={cn(
                                "text-primary-foreground px-2 py-1 rounded-md",
                                variables.includes(variable)
                                  ? "bg-primary"
                                  : "bg-destructive text-white line-through"
                              )}
                            >
                              {variable}
                            </span>
                          );
                        })}
                        {currentVariables.length === 0 &&
                          variables.map((variable) => {
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
                    <FormField
                      control={CreatePromptForm.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
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
                      control={CreatePromptForm.control}
                      name="approved"
                      render={({ field }) => (
                        <FormItem className="flex items-end gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <FormLabel>
                            Approve
                            <span className="text-xs font-normal">
                              {
                                " (Checking this option will make the prompt the latest version and will be available for use in production.)"
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
                        {currentVersion ? currentVersion + 1 : 1}
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
                  {confirmAndSaveView && <Button type="submit">Save</Button>}
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
