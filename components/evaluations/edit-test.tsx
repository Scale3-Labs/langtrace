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
import { Test } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Info } from "../shared/info";

export function EditTest({
  test,
  projectId,
  className = "w-full text-left p-0 text-muted-foreground hover:text-primary flex items-center",
}: {
  test: Test;
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
    description: z.string().min(2, "Too short").max(200, "Too long"),
  });
  const EditTestForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: test.name || "",
      description: test.description || "",
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
                Edit Test
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
                Delete Test
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>
              Edit the test by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <Form {...EditTestForm}>
            <form
              onSubmit={EditTestForm.handleSubmit(async (data) => {
                try {
                  setBusy(true);
                  await fetch("/api/test", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: test.id,
                      name: data.name,
                      description: data.description,
                    }),
                  });
                  await queryClient.invalidateQueries(
                    `fetch-tests-${projectId}-query`
                  );
                  toast("Test saved!", {
                    description: "Your test has been saved.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error saving your test!", {
                    description: `There was an error saving your test: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              })}
              className="flex flex-col gap-4"
            >
              <FormField
                disabled={busy}
                control={EditTestForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name
                      <Info
                        information="The name of the test."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="capitalize"
                        placeholder="Needle in a haystack"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={busy}
                control={EditTestForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description
                      <Info
                        information="A brief description of the test."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Insert the question in between random text. If the question is answered correctly, the test is passed."
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
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setBusy(true);
                  await fetch("/api/test", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: test.id,
                    }),
                  });
                  await queryClient.invalidateQueries(
                    `fetch-tests-${projectId}-query`
                  );
                  toast("Test deleted!", {
                    description: "Your test has been deleted.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error deleting your test!", {
                    description: `There was an error deleting your test: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Delete Test
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
