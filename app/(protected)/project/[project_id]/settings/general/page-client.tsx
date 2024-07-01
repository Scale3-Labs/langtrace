"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RabbitIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ProfileView() {
  const projectId = useParams()?.project_id as string;
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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
      setName(result.project.name);
      setDescription(result.project.description);
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
          <p className="mt-3 text-sm text-muted-foreground">
            Note: Please contact support to change your email address
          </p>
        </CardContent>
      </Card>
    );
  }
}
