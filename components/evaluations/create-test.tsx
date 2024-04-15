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
import { Info } from "../shared/info";

export function CreateTest({
  projectId,
  disabled = false,
  variant = "default",
  className = "",
  email,
}: {
  projectId: string;
  disabled?: boolean;
  variant?: any;
  className?: string;
  email?: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const schema = z.object({
    name: z.string().min(2, "Too short").max(30, "Too long"),
    description: z.string().min(2, "Too short").max(200, "Too long"),
  });
  const CreateTestForm = useForm({
    resolver: zodResolver(schema),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant={variant} className={className}>
          Create Test <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Test</DialogTitle>
          <DialogDescription>
            Create a new test to evaluate your model.
          </DialogDescription>
        </DialogHeader>
        <Form {...CreateTestForm}>
          <form
            onSubmit={CreateTestForm.handleSubmit(async (data) => {
              try {
                setBusy(true);
                await fetch("/api/test", {
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
                  `fetch-tests-${projectId}-query`
                );
                toast("Test created!", {
                  description: "Your test has been created.",
                });
                setOpen(false);
                CreateTestForm.reset();
              } catch (error: any) {
                toast("Error creating your test!", {
                  description: `There was an error creating your test: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={busy}
              control={CreateTestForm.control}
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
              control={CreateTestForm.control}
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
                Create Test
                <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
