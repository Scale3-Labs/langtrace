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
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "react-query";
import { toast } from "sonner";

export function DeleteData({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={"icon"}>
          <TrashIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Data</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this data?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                setBusy(true);
                await fetch("/api/data", {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: id,
                  }),
                });
                await queryClient.invalidateQueries({ queryKey: [id] });
                toast("Dataset deleted!", {
                  description: "Your data set has been deleted.",
                });
                setOpen(false);
              } catch (error: any) {
                toast("Error deleting your data set!", {
                  description: `There was an error deleting your data set: ${error.message}`,
                });
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            Delete Dataset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
