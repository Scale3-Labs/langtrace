"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormDescription, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CodeIcon, RabbitIcon, RefreshCwIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { z } from "zod";

export default function PageClient() {
  const [apiKey, setApiKey] = useState<string>();
  const [busy, setBusy] = useState(false);
  const projectId = useParams()?.project_id as string;

  const handleApiKeyGenerated = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const generateApiKey = async () => {
    try {
      setBusy(true);
      const response = await fetch(`/api/api-key?project_id=${projectId}`, {
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

  const NameFormSchema = z.object({
    name: z
      .string()
      .min(3, { message: "Name must be 3 to 20 characters long" })
      .max(20, { message: "Name must be 20 or less characters long" }),
  });

  const NameDetailsForm = useForm({
    resolver: zodResolver(NameFormSchema),
    defaultValues: {
      //   name: user?.Team.name || "",
    },
  });

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
          <CardTitle>API Key</CardTitle>
          <CardDescription>Generate your project API Key here</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <Form {...NameDetailsForm}>
            <form className="flex w-full flex-col gap-4">
              <FormLabel>API Key</FormLabel>
              <FormDescription className="text-red-600 font-bold">
                {project.project.apiKeyHash && !apiKey
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
                  variant={
                    project.project.apiKeyHash ? "destructive" : "default"
                  }
                  onClick={generateApiKey}
                  disabled={busy}
                >
                  {project.project.apiKeyHash ? (
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                  ) : (
                    <CodeIcon className="mr-2 h-4 w-4" />
                  )}
                  {project.project.apiKeyHash
                    ? "Re-generate API Key"
                    : "Generate API Key"}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }
}
