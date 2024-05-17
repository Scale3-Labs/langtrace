import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/constants";
import { useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";

export interface PromptRegistry {
  span_id: string;
  name: string;
}

export interface PromptRegistryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (promptRegistry: PromptRegistry) => void;
}

export default function PromptRegistryDialog({
  open,
  onClose,
  onSelect,
}: PromptRegistryDialogProps) {
  const [currentData, setCurrentData] = useState<PromptRegistry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showLoader, setShowLoader] = useState(false);
  console.log("PromptRegistryDialog", open);

  const fetchPrompts = useQuery({
    queryKey: [`fetch-prompts-query`, page],
    queryFn: async () => {
      const response = await fetch(
        `/api/span-prompt?projectId=projectId&page=${page}&pageSize=${PAGE_SIZE}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch prompts");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      const newData = data?.prompts?.result || [];
      const metadata = data?.prompts?.metadata || {};

      setTotalPages(parseInt(metadata?.total_pages) || 1);
      if (parseInt(metadata?.page) <= parseInt(metadata?.total_pages)) {
        setPage(parseInt(metadata?.page) + 1);
      }

      if (currentData.length > 0) {
        const updatedData = [...currentData, ...newData];
        const uniqueData = updatedData.filter(
          (v: any, i: number, a: any) =>
            a.findIndex((t: any) => t.span_id === v.span_id) === i
        );

        setCurrentData(uniqueData);
      } else {
        setCurrentData(newData);
      }
      setShowLoader(false);
    },
    onError: (error) => {
      setCurrentData([]);
      setShowLoader(false);
      toast.error("Failed to fetch prompts", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (fetchPrompts.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Select or Create a Prompt Registry
          </AlertDialogTitle>
          <AlertDialogDescription>
            Select a prompt registry or create a new one.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          {currentData.map((promptRegistry) => (
            <div key={promptRegistry.span_id}>
              <button onClick={() => onSelect(promptRegistry)}>
                {promptRegistry.name}
              </button>
            </div>
          ))}
          {page < totalPages && (
            <Button onClick={() => setPage(page + 1)} disabled={showLoader}>
              Load More
            </Button>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              /* Handle create new prompt registry */
            }}
          >
            Create New
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
