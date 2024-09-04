"use client";

import ProjectTypesDropdown from "@/components/project/project-type-dropdown";
import { Info } from "@/components/shared/info";
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
import { Skeleton } from "@/components/ui/skeleton";
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
    type: z.string().optional(),
  });

  const ProjectDetailsForm = useForm({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
    },
  });

  const saveProjectDetails = async (data: FieldValues) => {
    try {
      setBusy(true);
      const payload = {
        name: data.name.toLowerCase(),
        description: data.description.toLowerCase(),
        id: project.project.id,
        type: data.type,
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
        type: project.project.type ? project.project.type : "default",
      });
    }
  }, [project, ProjectDetailsForm]);

  if (projectLoading) {
    return <PageSkeleton />;
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
            <CardTitle>Project</CardTitle>
            <CardDescription>Update your project details here</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            <Form {...ProjectDetailsForm}>
              <form className="flex w-full flex-col gap-4">
                <FormLabel>Project ID</FormLabel>
                <div className="flex items-center bg-muted p-2 rounded-md justify-between">
                  <p
                    onClick={() => {
                      navigator.clipboard.writeText(project.project.id);
                      toast.success("Copied to clipboard");
                    }}
                    className="text-sm select-all dark:selection:bg-orange-600 selection:bg-orange-300"
                  >
                    {project.project.id}
                  </p>
                </div>
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
                <FormField
                  disabled={busy}
                  control={ProjectDetailsForm.control}
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

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
          <CardDescription>Update your project details here</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center bg-muted p-2 rounded-md justify-between">
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-20 mt-4" />
          </div>
        </CardContent>
      </Card>
      <div className="py-2">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <div className="w-full bg-red-100 bg-opacity-50 rounded-lg dark:bg-red-900 dark:bg-opacity-50">
            <Dialog>
              <Skeleton className="h-10 w-24 m-4" />
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-60 mt-2" />
                </DialogHeader>
                <DialogFooter>
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
