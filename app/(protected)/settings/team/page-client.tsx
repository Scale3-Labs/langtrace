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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CodeIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function TeamView({ user }: { user: any }) {
  const [apiKey, setApiKey] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleApiKeyGenerated = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const generateApiKey = async () => {
    try {
      setBusy(true);
      const response = await fetch(`/api/api-key?team_id=${user.Team.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      setApiKey(result.data.apiKey);
      handleApiKeyGenerated(result.data.apiKey);
      toast("Copy your API Key!", {
        description: "Please copy your API key. It will not be shown again.",
      });
    } catch (error: any) {
      toast("Error generating API Key!", {
        description: `There was an error generating your API Key: ${error.message}`,
      });
    } finally {
      setBusy(false);
    }
  };

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
            <FormLabel>Team ID</FormLabel>
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
            <FormLabel>API Key</FormLabel>
            <FormDescription className="text-red-600 font-bold">
              {user.Team.apiKeyHash && !apiKey
                ? "Note: If you regenerate the API key, the old key will be replaced."
                : "Note: Click to copy this API key as it will NOT be shown again."}
            </FormDescription>
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
                />
              </div>
            )}
            {!apiKey && (
              <Button
                className="w-fit"
                variant={user.Team.apiKeyHash ? "destructive" : "default"}
                onClick={generateApiKey}
                disabled={busy}
              >
                {user.Team.apiKeyHash ? (
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                ) : (
                  <CodeIcon className="mr-2 h-4 w-4" />
                )}
                {user.Team.apiKeyHash
                  ? "Re-generate API Key"
                  : "Generate API Key"}
              </Button>
            )}
            <Button
              type="button"
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
