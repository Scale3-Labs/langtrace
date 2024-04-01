import { Info } from "@/components/shared/info";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

export function CreateData({
  datasetId,
  variant = "default",
  className = "",
}: {
  datasetId: string;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    input: z.string().min(2, "Too short").max(200, "Too long"),
    output: z.string().min(2, "Too short").max(2000, "Too long"),
    note: z.string().max(25, "Too long").optional(),
  });
  const CreateDataForm = useForm({
    resolver: zodResolver(schema),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          Create Data <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Data</DialogTitle>
          <DialogDescription>
            Create a new data by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreateDataForm}>
          <form
            onSubmit={CreateDataForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                await fetch("/api/data", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    datas: [
                      {
                        input: data.input,
                        output: data.output,
                        note: data.note || "",
                      },
                    ],
                    datasetId,
                  }),
                });
                await queryClient.invalidateQueries(datasetId);
                toast("Data added!", {
                  description: "Your data has been added.",
                });
                setOpen(false);
              } catch (error: any) {
                toast("Error added your data!", {
                  description: `There was an error added your data: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={busy}
              control={CreateDataForm.control}
              name="input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Input
                    <Info
                      information="The input data. Ex: user input"
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Hi, how are you?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={CreateDataForm.control}
              name="output"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Output
                    <Info
                      information="Response to the input data by the LLM."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="I'm good, how can I help you?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={CreateDataForm.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Note
                    <Info
                      information="Any additional notes for the data."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="User is asking for help." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Create Data
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePrompt({
  promptsetId,
  variant = "default",
  className = "",
}: {
  promptsetId: string;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    value: z.string().min(2, "Too short").max(2000, "Too long"),
    note: z.string().max(25, "Too long").optional(),
  });
  const CreatePromptsetForm = useForm({
    resolver: zodResolver(schema),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          Create Prompt <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Prompt</DialogTitle>
          <DialogDescription>
            Create a new prompt by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreatePromptsetForm}>
          <form
            onSubmit={CreatePromptsetForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                await fetch("/api/promptdata", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    datas: [{ value: data.value, note: data.note || "" }],
                    promptsetId,
                  }),
                });
                await queryClient.invalidateQueries(promptsetId);
                toast("Prompt added!", {
                  description: "Your prompt has been added.",
                });
                setOpen(false);
              } catch (error: any) {
                toast("Error creating your prompt!", {
                  description: `There was an error creating your prompt: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={busy}
              control={CreatePromptsetForm.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Value
                    <Info
                      information="The prompt value. Ex: You are a documentation writer. Answer in a courteous manner."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="You are a documentation writer. Answer in a courteous manner."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={CreatePromptsetForm.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Note
                    <Info
                      information="Any additional notes for the prompt."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Documentation writer prompt."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Create Prompt
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
