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
import { PlusIcon } from "@radix-ui/react-icons";
import { ClipboardIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ApiKeyDialog({
  project_id,
  variant = "default",
  className = "",
}: {
  project_id: string;
  variant?: any;
  className?: string;
}) {
  const [busy, setBusy] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          Generate API Key <PlusIcon className="ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[580px]">
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
                const response = await fetch(`/api/api-key?id=${project_id}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                });
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
    </Dialog>
  );
}
