import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePathname } from "next/navigation";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { CreatePromptset } from "../project/dataset/create";

export interface PromptRegistryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (promptRegistry: any) => void;
}

export default function PromptRegistryDialog({
  open,
  onClose,
  onSelect,
}: PromptRegistryDialogProps) {
  const pathname = usePathname();

  const projectId = pathname.split("/")[2];

  const {
    data: promptsets,
    isLoading: promptsetsLoading,
    error: promptsetsError,
  } = useQuery({
    queryKey: ["fetch-promptsets-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/promptset?id=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch prompt sets");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch prompt sets", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });
  if (promptsetsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Select or Create a Prompt Registry
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div>
          {promptsets?.promptsets?.length > 0 ? (
            promptsets.promptsets.map((promptset: any, i: number) => (
              <div key={i}>
                <button
                  className="hover:bg-muted rounded-md p-4 w-full text-left"
                  onClick={() => onSelect(promptset)}
                >
                  {promptset.name}
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">
              Get started by creating your first prompt registry.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <CreatePromptset projectId={projectId} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
