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

export function ModelCombobox({
  setSelectedModel,
  selectedModel,
}: {
  setSelectedModel: (model: string) => void;
  selectedModel?: string;
}) {
  const project_id = useParams()?.project_id as string;
  const [open, setOpen] = useState(false);
  const [modelIds, setModelIds] = useState<string[]>([]);

  const fetchmodelIds = useQuery({
    queryKey: ["fetch-model-ids-query", project_id],
    queryFn: async () => {
      const response = await fetch(`/api/model-ids?projectId=${project_id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch model ids");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data: { models: any }) => {
      setModelIds(data?.models || []);
    },
    onError: (error) => {
      toast.error("Failed to fetch model ids");
    },
  });

  if (fetchmodelIds.isLoading) {
    return <Skeleton className="h-8 w-44 rounded-md" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedModel ? selectedModel : "select model..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No models found.</CommandEmpty>
          <CommandGroup>
            {modelIds.length > 0 ? (
              modelIds.map((id: string) => (
                <CommandItem
                  key={id}
                  value={id}
                  onSelect={(currentValue) => {
                    setSelectedModel(
                      currentValue === selectedModel ? "" : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedModel === id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {id}
                </CommandItem>
              ))
            ) : (
              <CommandItem className="p-2 text-xs flex items-center justify-center">
                No models found.
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
