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
import { ClipboardIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GenerateApiKey({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState("");
  return (
    <Dialog>
      <DialogTrigger>
        <Button size={"sm"}>Generate API Key</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Generate API Key</DialogTitle>
          <DialogDescription>
            Note: If you already have an API key, it will be replaced.
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
                const response = await fetch(`/api/api-key?id=${projectId}`, {
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
