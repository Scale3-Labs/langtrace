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
import { DEFAULT_TESTS } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Info } from "../shared/info";

export function Create({
  teamId,
  variant = "default",
  className = "",
}: {
  teamId: string;
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
  const CreateProjectForm = useForm({
    resolver: zodResolver(schema),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          Create Project <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreateProjectForm}>
          <form
            onSubmit={CreateProjectForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                const result = await fetch("/api/project", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: data.name,
                    description: data.description.toLowerCase(),
                    teamId,
                  }),
                });
                await queryClient.invalidateQueries("fetch-projects-query");
                toast("Project created!", {
                  description: "Your project has been created.",
                });
                setOpen(false);
                CreateProjectForm.reset();

                // create default tests
                const projectId = (await result.json()).data.id;
                for (const test of DEFAULT_TESTS) {
                  await fetch("/api/test", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      name: test.name,
                      description: test.description,
                      projectId: projectId,
                    }),
                  });
                }
              } catch (error: any) {
                toast("Error creating your project!", {
                  description: `There was an error creating your project: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={busy}
              control={CreateProjectForm.control}
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
                      placeholder="Website Chatbot"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={busy}
              control={CreateProjectForm.control}
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
                      placeholder="A chatbot for our website."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Create Project
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
