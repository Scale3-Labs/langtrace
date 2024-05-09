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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Dataset, Promptset } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

export function EditDataSet({
  dataset,
  className = "w-full text-left p-0 text-muted-foreground hover:text-primary flex items-center",
}: {
  dataset: Dataset;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    name: z.string().min(2, "Too short").max(30, "Too long"),
    description: z.string().min(2, "Too short").max(100, "Too long"),
  });
  const EditDataSetForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: dataset.name || "",
      description: dataset.description || "",
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={"icon"}>
            <DotsHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem>
            <DialogTrigger asChild>
              <button
                className={className}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                  setOpenDelete(false);
                  setOpenEdit(true);
                }}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Dataset
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DialogTrigger asChild>
              <button
                className={className}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                  setOpenDelete(true);
                  setOpenEdit(false);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Dataset
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Dataset</DialogTitle>
            <DialogDescription>
              Edit the dataset by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <Form {...EditDataSetForm}>
            <form
              onSubmit={EditDataSetForm.handleSubmit(async (data) => {
                try {
                  setBusy(true);
                  await fetch("/api/dataset", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: dataset.id,
                      name: data.name,
                      description: data.description,
                    }),
                  });
                  await queryClient.invalidateQueries(
                    "fetch-datasets-stats-query"
                  );
                  toast("Dataset saved!", {
                    description: "Your dataset has been saved.",
                  });
                  setOpen(false);
                  EditDataSetForm.reset();
                } catch (error: any) {
                  toast("Error saving your dataset!", {
                    description: `There was an error saving your dataset: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              })}
              className="flex flex-col gap-4"
            >
              <FormField
                disabled={busy}
                control={EditDataSetForm.control}
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
                        placeholder="Good Data"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={busy}
                control={EditDataSetForm.control}
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
                        placeholder="Good dataset generated by the chatbot."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={busy}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      )}
      {openDelete && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Dataset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dataset?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setBusy(true);
                  await fetch("/api/dataset", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: dataset.id,
                    }),
                  });
                  await queryClient.invalidateQueries(
                    "fetch-datasets-stats-query"
                  );
                  toast("Dataset deleted!", {
                    description: "Your dataset has been deleted.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error deleting your dataset!", {
                    description: `There was an error deleting your dataset: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Delete Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

export function EditPromptSet({
  promptset,
  projectId,
  className = "w-full text-left p-0 text-muted-foreground hover:text-primary flex items-center",
}: {
  promptset: Promptset;
  projectId: string;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    name: z.string().min(2, "Too short").max(30, "Too long"),
    description: z.string().min(2, "Too short").max(100, "Too long"),
  });
  const EditPromptSetForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: promptset?.name || "",
      description: promptset?.description || "",
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={"icon"}>
            <DotsHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem>
            <DialogTrigger asChild>
              <button
                className={className}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                  setOpenDelete(false);
                  setOpenEdit(true);
                }}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Prompt Registry
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DialogTrigger asChild>
              <button
                className={className}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                  setOpenDelete(true);
                  setOpenEdit(false);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Prompt Registry
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt Registry</DialogTitle>
            <DialogDescription>
              Edit the prompt registry by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <Form {...EditPromptSetForm}>
            <form
              onSubmit={EditPromptSetForm.handleSubmit(async (data) => {
                try {
                  setBusy(true);
                  await fetch("/api/promptset", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: promptset.id,
                      name: data.name,
                      description: data.description,
                    }),
                  });
                  await queryClient.invalidateQueries({
                    queryKey: ["fetch-promptsets-query", projectId],
                  });
                  toast("Prompt registry saved!", {
                    description: "Your prompt registry has been saved.",
                  });
                  setOpen(false);
                  EditPromptSetForm.reset();
                } catch (error: any) {
                  toast("Error saving your prompt registry!", {
                    description: `There was an error saving your prompt registry: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              })}
              className="flex flex-col gap-4"
            >
              <FormField
                disabled={busy}
                control={EditPromptSetForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name
                      <Info
                        information="The name of the prompt registry."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="capitalize"
                        placeholder="Good Prompts"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={busy}
                control={EditPromptSetForm.control}
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
                        placeholder="Good set of prompts that give accurate responses."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={busy}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      )}
      {openDelete && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Prompt Registry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt registry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setBusy(true);
                  await fetch("/api/promptset", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: promptset.id,
                    }),
                  });
                  await queryClient.invalidateQueries({
                    queryKey: ["fetch-promptsets-query", projectId],
                  });
                  toast("Prompt registry deleted!", {
                    description: "Your prompt registry has been deleted.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error deleting your prompt registry!", {
                    description: `There was an error deleting your prompt registry: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Delete Prompt Registry
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
