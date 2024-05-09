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

export function CreateDataset({
  projectId,
  disabled = false,
  variant = "default",
  className = "",
}: {
  projectId?: string;
  disabled?: boolean;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    name: z.string().min(2, "Too short").max(30, "Too long"),
    description: z.string().min(2, "Too short").max(100, "Too long"),
  });
  const CreateDatasetForm = useForm({
    resolver: zodResolver(schema),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant={variant} className={className}>
          Create Dataset <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Dataset</DialogTitle>
          <DialogDescription>
            Create a new dataset by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreateDatasetForm}>
          <form
            onSubmit={CreateDatasetForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                await fetch("/api/dataset", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: data.name,
                    description: data.description.toLowerCase(),
                    projectId,
                  }),
                });
                await queryClient.invalidateQueries(
                  "fetch-datasets-stats-query"
                );
                await queryClient.invalidateQueries("fetch-datasets-query");
                toast("Dataset created!", {
                  description: "Your dataset has been created.",
                });
                setOpen(false);
                CreateDatasetForm.reset();
              } catch (error: any) {
                toast("Error creating your dataset!", {
                  description: `There was an error creating your dataset: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={busy}
              control={CreateDatasetForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name
                    <Info
                      information="The name of the dataset."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="capitalize"
                      placeholder="Website Chatbot Good Data"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={CreateDatasetForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description
                    <Info
                      information="A brief description of the dataset."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Good data collected from the chatbot."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Create Dataset
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePromptset({
  projectId,
  disabled = false,
  variant = "default",
  className = "",
}: {
  projectId?: string;
  disabled?: boolean;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    name: z.string().min(2, "Too short").max(30, "Too long"),
    description: z.string().min(2, "Too short").max(100, "Too long"),
  });
  const CreatePromptsetForm = useForm({
    resolver: zodResolver(schema),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant={variant} className={className}>
          Create Prompt Registry <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Prompt Registry</DialogTitle>
          <DialogDescription>
            Create a new prompt registry by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreatePromptsetForm}>
          <form
            onSubmit={CreatePromptsetForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                await fetch("/api/promptset", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: data.name,
                    description: data.description.toLowerCase(),
                    projectId,
                  }),
                });
                await queryClient.invalidateQueries({
                  queryKey: ["fetch-promptsets-query", projectId],
                });
                await queryClient.invalidateQueries("fetch-promptsets-query");
                toast("Prompt registry created!", {
                  description: "Your prompt registry has been created.",
                });
                setOpen(false);
                CreatePromptsetForm.reset();
              } catch (error: any) {
                toast("Error creating your prompt registry!", {
                  description: `There was an error creating your prompt registry: ${error.message}`,
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name
                    <Info
                      information="The name of the prompt set."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="capitalize"
                      placeholder="Chatbot assistant"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description
                    <Info
                      information="A brief description of the prompt set."
                      className="inline-block ml-2"
                    />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Prompt for the chatbot assistant."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Create Prompt Registry
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
