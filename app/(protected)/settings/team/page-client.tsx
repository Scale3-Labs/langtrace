"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function TeamView({ user }: { user: any }) {
  // const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const NameFormSchema = z.object({
    name: z
      .string()
      .min(3, { message: "Name must be 3 to 20 characters long" })
      .max(20, { message: "Name must be 20 or less characters long" }),
  });

  const NameDetailsForm = useForm({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      name: user?.Team.name || "",
    },
  });

  const saveNameDetails = async (data: FieldValues) => {
    try {
      setBusy(true);
      const payload = {
        name: data.name.toLowerCase(),
        id: user.Team.id,
      };
      await fetch("/api/team", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      toast.success("Name updated successfully");
    } catch (error) {
      toast.error("Error updating name");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>Update your team details here</CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <Form {...NameDetailsForm}>
          <form className="flex w-full flex-col gap-4">
            <div className="flex items-center bg-muted p-2 rounded-md justify-between">
              <p
                onClick={() => {
                  navigator.clipboard.writeText(user.Team.id);
                  toast.success("Copied to clipboard");
                }}
                className="text-sm select-all selection:bg-blue-200"
              >
                {user.Team.id}
              </p>
            </div>
            <FormField
              disabled={busy}
              control={NameDetailsForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input
                      className="capitalize"
                      placeholder="Microsoft"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={busy}
              onClick={NameDetailsForm.handleSubmit(saveNameDetails)}
              className="w-fit"
            >
              Save
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
