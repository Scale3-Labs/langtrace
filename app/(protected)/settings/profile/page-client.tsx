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
import { User } from "@prisma/client";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function ProfileView({ user }: { user: User }) {
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
      name: user?.name || "",
    },
  });

  const saveNameDetails = async (data: FieldValues) => {
    try {
      setBusy(true);
      const payload = {
        name: data.name.toLowerCase(),
        id: user.id,
      };
      await fetch("/api/user", {
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
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your profile details here</CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <Form {...NameDetailsForm}>
          <form className="flex w-full flex-col gap-4">
            <FormField
              disabled={busy}
              control={NameDetailsForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      className="capitalize"
                      placeholder="Satya Nadella"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="satya@microsoft.com"
                  value={user?.email as string}
                  disabled={true}
                />
              </FormControl>
            </FormItem>
            <Button
              disabled={busy}
              onClick={NameDetailsForm.handleSubmit(saveNameDetails)}
              className="w-fit"
            >
              Save
            </Button>
          </form>
        </Form>
        <p className="mt-3 text-sm text-muted-foreground">
          Note: Please contact to change your email address
        </p>
      </CardContent>
    </Card>
  );
}
