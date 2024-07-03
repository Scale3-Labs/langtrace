"use client";

import { Spinner } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
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
import { RabbitIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

export default function ProjectView() {
  const projectId = useParams()?.project_id as string;
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const NameFormSchema = z.object({
    name: z
      .string()
      .min(3, { message: "Name must be 3 to 20 characters long" })
      .max(20, { message: "Name must be 20 or less characters long" }),
    description: z.string().optional(),
  });

  const ProjectDetailsForm = useForm({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const saveProjectDetails = async (data: FieldValues) => {
    try {
      setBusy(true);
      const payload = {
        name: data.name.toLowerCase(),
        description: data.description.toLowerCase(),
        id: project.project.id,
      };
      await fetch(`/api/project?id=${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      toast.success("Project updated successfully");
    } catch (error) {
      toast.error("Error updating project");
    } finally {
      setBusy(false);
    }
  };

  const deleteProject = async () => {
    try {
      setBusy(true);
      await fetch("/api/project", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: project.project.id,
          teamId: project,
        }),
      });
      await queryClient.invalidateQueries("fetch-projects-query");
      toast("Project deleted!", {
        description: "Your project has been deleted.",
      });
      router.push("/projects");
    } catch (error: any) {
      toast("Error deleting your project!", {
        description: `There was an error deleting your project: ${error.message}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["fetch-project-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/project?id=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch project");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch project", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  useEffect(() => {
    if (project) {
      ProjectDetailsForm.reset({
        name: project.project.name,
        description: project.project.description
          ? project.project.description
          : "",
      });
    }
  }, [project, ProjectDetailsForm]);

  if (projectLoading) {
    return <div>Loading...</div>;
  } else if (projectError) {
    return (
      <div className="py-12 px-12 flex flex-col items-center justify-center gap-4 mt-8 w-full">
        <RabbitIcon size={80} />
        <p className="font-semibold">Failed to fetch project</p>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your project details here</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <Form {...ProjectDetailsForm}>
              <form className="flex w-full flex-col gap-4">
                <FormField
                  control={ProjectDetailsForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          className="capitalize"
                          placeholder="My Project"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormLabel>Project ID</FormLabel>
                <div className="flex items-center bg-muted p-2 rounded-md justify-between">
                  <p
                    onClick={() => {
                      navigator.clipboard.writeText(project.project.id);
                      toast.success("Copied to clipboard");
                    }}
                    className="text-sm select-all selection:bg-blue-200"
                  >
                    {project.project.id}
                  </p>
                </div>
                <FormField
                  control={ProjectDetailsForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          className="capitalize"
                          placeholder="Project Description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  disabled={busy}
                  onClick={ProjectDetailsForm.handleSubmit(saveProjectDetails)}
                  className="w-fit"
                >
                  Save
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="py-2">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle>Delete Project</CardTitle>
              <CardDescription>
                This project will be permanently deleted, including all of its
                traces, datasets, evaluations, etc. This action is irreversible
                and can not be undone.
              </CardDescription>
            </CardHeader>
            <div className="w-full bg-red-100 bg-opacity-50 rounded-lg dark:bg-red-900 dark:bg-opacity-50">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="m-4 w-fit" variant={"destructive"}>
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                      This project will be permanently deleted, including all of
                      its traces, datasets, evaluations, etc. This action is
                      irreversible and can not be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose disabled={busy}>
                      <Button variant={"outline"}>Cancel</Button>
                    </DialogClose>
                    <Button
                      disabled={busy}
                      onClick={deleteProject}
                      variant={"destructive"}
                    >
                      {busy ? (
                        <>
                          <p>Deleting... </p>
                          <Spinner />
                        </>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>
      </div>
    );
  }
}
