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
import { Data, Prompt } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

export function EditData({
  idata,
  datasetId,
  className = "w-full text-left p-0 text-muted-foreground hover:text-primary flex items-center",
}: {
  idata: Data;
  datasetId: string;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    input: z.string().min(2, "Too short").max(200, "Too long"),
    output: z.string().min(2, "Too short").max(2000, "Too long"),
    note: z.string().max(25, "Too long").optional(),
  });
  const EditDataForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      input: idata.input || "",
      output: idata.output || "",
      note: idata.note || "",
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
                  setOpenDelete(false);
                  setOpen(true);
                  setOpenEdit(true);
                }}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Data
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
                  setOpenDelete(true);
                  setOpen(true);
                  setOpenEdit(false);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Data
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Data</DialogTitle>
            <DialogDescription>
              Edit the data by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <Form {...EditDataForm}>
            <form
              onSubmit={EditDataForm.handleSubmit(async (data) => {
                try {
                  setBusy(true);
                  await fetch("/api/data", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: idata.id,
                      input: data.input,
                      output: data.output,
                      note: data.note,
                    }),
                  });
                  await queryClient.invalidateQueries(datasetId);
                  toast("Data saved!", {
                    description: "Your data has been saved.",
                  });
                  setOpen(false);
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
                control={EditDataForm.control}
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
                control={EditDataForm.control}
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
                control={EditDataForm.control}
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
                      <Input
                        placeholder="User is asking for help."
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
            <DialogTitle>Delete Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this data?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setBusy(true);
                  await fetch("/api/data", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: idata.id,
                    }),
                  });
                  await queryClient.invalidateQueries(datasetId);
                  toast("Promptset deleted!", {
                    description: "Your prompt set has been deleted.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error deleting your prompt set!", {
                    description: `There was an error deleting your prompt set: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Delete Promptset
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

export function EditPrompt({
  prompt,
  promptSetId,
  className = "w-full text-left p-0 text-muted-foreground hover:text-primary flex items-center",
}: {
  prompt: Prompt;
  promptSetId: string;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    value: z.string().min(2, "Too short").max(2000, "Too long"),
    note: z.string().max(25, "Too long").optional(),
  });
  const EditPromptSetForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      value: prompt.value || "",
      note: prompt.note || "",
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
                Edit Prompt
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
                Delete Prompt
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Edit the prompt by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <Form {...EditPromptSetForm}>
            <form
              onSubmit={EditPromptSetForm.handleSubmit(async (data) => {
                try {
                  setBusy(true);
                  await fetch("/api/promptdata", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: prompt.id,
                      value: data.value,
                      note: data.note || "",
                    }),
                  });
                  await queryClient.invalidateQueries(promptSetId);
                  toast("Prompt saved!", {
                    description: "Your prompt has been saved.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error saving your prompt!", {
                    description: `There was an error saving your prompt: ${error.message}`,
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
                control={EditPromptSetForm.control}
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
                        placeholder="User is asking for help."
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
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setBusy(true);
                  await fetch("/api/prompt", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: prompt.id,
                    }),
                  });
                  await queryClient.invalidateQueries(promptSetId);
                  toast("Prompt deleted!", {
                    description: "Your prompt has been deleted.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error deleting your prompt set!", {
                    description: `There was an error deleting your prompt: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Delete Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
