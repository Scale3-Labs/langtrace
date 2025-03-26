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
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

export function TracesDownload({ project_id }: { project_id: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={"icon"} variant={"outline"}>
          <DownloadIcon className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Download Traces</DialogTitle>
          <DialogDescription>
            Please note that we allow downloading only the last 100 traces. The
            downloaded file will be in JSON format. Note that the file will have
            a list of traces. Each trace is again a list of spans.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="w-full"
            type="submit"
            onClick={async () => {
              try {
                const apiEndpoint = "/api/traces";
                const body = {
                  page: 1,
                  pageSize: 100,
                  projectId: project_id,
                  filters: {
                    filters: [],
                    operation: "OR",
                  },
                  group: true,
                };

                const response = await fetch(apiEndpoint, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(body),
                });
                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error?.message || "Failed to fetch traces");
                }
                toast.success(
                  "Traces are being downloaded. Please wait for the download to start."
                );
                const data = await response.json();
                const traces = data?.traces?.result;

                // Download the traces as json
                const blob = new Blob([JSON.stringify(traces, null, 2)], {
                  type: "application/json",
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `traces_${project_id}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                toast.error(
                  "Something went wrong downloading the traces. Please try again later."
                );
              }
            }}
          >
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
