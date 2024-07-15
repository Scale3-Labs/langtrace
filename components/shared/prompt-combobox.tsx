import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Check, ChevronsUpDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useQuery } from "react-query";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";

export function PromptCombobox({
  setSelectedPrompt,
  selectedPrompt,
}: {
  setSelectedPrompt: (prompt: string) => void;
  selectedPrompt?: string;
}) {
  const project_id = useParams()?.project_id as string;
  const [open, setOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptIdState] = useState(
    selectedPrompt || ""
  );
  const [promptIds, setPromptIds] = useState<string[]>([]);

  const handleSelectPrompt = (currentValue: string) => {
    const newPromptId = currentValue === selectedPromptId ? "" : currentValue;
    setSelectedPromptIdState(newPromptId);
    setSelectedPrompt(newPromptId);

    setOpen(false);
  };

  const fetchPromptIds = useQuery({
    queryKey: ["fetch-prompt-ids-query", project_id],
    queryFn: async () => {
      const response = await fetch(`/api/prompt-ids?projectId=${project_id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch prompt ids");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data: { promptIDs: any }) => {
      setPromptIds(data?.promptIDs || []);
    },
    onError: (error) => {
      toast.error("Failed to fetch prompt ids", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (fetchPromptIds.isLoading) {
    return <Skeleton className="h-8 w-44 rounded-md" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between"
        >
          {selectedPromptId ? selectedPromptId : "select prompt id..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Search prompts..." />
          <CommandEmpty>No prompt IDs found.</CommandEmpty>
          <CommandGroup>
            {promptIds.length > 0 ? (
              promptIds.map((id: string) => (
                <CommandItem
                  key={id}
                  value={id}
                  onSelect={(currentValue) => {
                    setSelectedPromptIdState(
                      currentValue === selectedPromptId ? "" : currentValue
                    );
                    setSelectedPrompt(
                      currentValue === selectedPromptId ? "" : currentValue
                    );
                    handleSelectPrompt(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedPromptId === id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {id}
                </CommandItem>
              ))
            ) : (
              <CommandItem className="p-2 text-xs flex items-center justify-center">
                No Prompt IDs found.
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
