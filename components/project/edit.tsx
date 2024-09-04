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
import { Project } from "@prisma/client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { ClipboardIcon, Code2Icon, EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Info } from "../shared/info";
import ProjectTypesDropdown from "./project-type-dropdown";

export function Edit({
  teamId,
  project,
  className = "w-full text-left p-0 text-muted-foreground hover:text-primary flex items-center",
}: {
  project: Project;
  teamId: string;
  variant?: any;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openApiKey, setOpenApiKey] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    name: z.string().min(2, "Too short").max(30, "Too long"),
    description: z.string().min(2, "Too short").max(100, "Too long"),
    type: z.string().optional(),
  });
  const EditProjectForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name || "",
      description: project.description || "",
      type: project.type || "default",
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
                  setOpenApiKey(true);
                  setOpenDelete(false);
                  setOpenEdit(false);
                }}
              >
                <Code2Icon className="h-4 w-4 mr-2" />
                Generate API Key
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
                  setOpenApiKey(false);
                  setOpenDelete(false);
                  setOpenEdit(true);
                }}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Project
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
                  setOpenApiKey(false);
                  setOpenDelete(true);
                  setOpenEdit(false);
                }}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Project
              </button>
            </DialogTrigger>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Edit the project by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <Form {...EditProjectForm}>
            <form
              onSubmit={EditProjectForm.handleSubmit(async (data) => {
                try {
                  setBusy(true);
                  await fetch("/api/project", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: project.id,
                      apiKeyHash: project.apiKeyHash,
                      name: data.name,
                      description: data.description,
                      teamId,
                      type: data.type || "default",
                    }),
                  });
                  await queryClient.invalidateQueries("fetch-projects-query");
                  toast("Project saved!", {
                    description: "Your project has been saved.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error saving your project!", {
                    description: `There was an error saving your project: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              })}
              className="flex flex-col gap-4"
            >
              <FormField
                disabled={busy}
                control={EditProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name
                      <Info
                        information="The name of the project."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="capitalize"
                        placeholder="Marketing"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={busy}
                control={EditProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description
                      <Info
                        information="A brief description of the project."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Documents for marketing team."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                disabled={busy}
                control={EditProjectForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 mt-1">
                    <FormLabel>
                      Project Type
                      <Info
                        information="The type of project. Leave blank for default."
                        className="inline-block ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <ProjectTypesDropdown
                        value={field.value}
                        setValue={field.onChange}
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
      {openApiKey && (
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription className="text-red-600 font-bold">
              Note: Click to copy this API key as it will NOT be shown again. If
              you already have an API key, it will be replaced.
            </DialogDescription>
            {apiKey && (
              <div className="flex items-center bg-muted p-2 rounded-md justify-between">
                <p
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast.success("Copied to clipboard");
                  }}
                  className="text-sm select-all selection:bg-blue-200"
                >
                  {apiKey}
                </p>
                <button
                  className="bg-primary-foreground rounded-md"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <ClipboardIcon className="h-4 w-4 cursor-pointer text-muted-foreground" />
                </button>
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={async () => {
                try {
                  setBusy(true);
                  const response = await fetch(
                    `/api/api-key?project_id=${project.id}`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                    }
                  );
                  const result = await response.json();
                  setApiKey(result.data.apiKey);
                  toast("Copy your API Key!", {
                    description:
                      "Please copy your API key. It will not be shown again.",
                  });
                } catch (error: any) {
                  toast("Error generating API Key!", {
                    description: `There was an error generating your API Key: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Generate API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
      {openDelete && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setBusy(true);
                  await fetch("/api/project", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: project.id,
                      teamId,
                    }),
                  });
                  await queryClient.invalidateQueries("fetch-projects-query");
                  toast("Project deleted!", {
                    description: "Your project has been deleted.",
                  });
                  setOpen(false);
                } catch (error: any) {
                  toast("Error deleting your project!", {
                    description: `There was an error deleting your project: ${error.message}`,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
