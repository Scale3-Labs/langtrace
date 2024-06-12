"use client";

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
import { useEffect, useState } from "react";

import { useQuery } from "react-query";
import { toast } from "sonner";

export function ModelCombobox({
  setSelectedModel,
  selectedModel,
}: {
  setSelectedModel: (model: string) => void;
  selectedModel?: string;
}) {
  const project_id = useParams()?.project_id as string;
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modelIds, setModelIds] = useState<string[]>([]);
  const [showLoader, setShowLoader] = useState(false);

  const handleSelectmodel = (currentValue: string) => {
    const newmodelId = currentValue === selectedModel ? "" : currentValue;
    setSelectedModel(newmodelId);

    setOpen(false);
  };

  useEffect(() => {
    setSelectedModel(selectedModel || "");
  }, [selectedModel]);

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
    onSuccess: (data: { modelIDs: any }) => {
      setModelIds(data?.modelIDs || []);
    },
    onError: (error) => {
      setShowLoader(false);
      toast.error("Failed to fetch model ids", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (fetchmodelIds.isLoading) {
    return <div>Loading...</div>;
  }

  const onInputChange = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedModel ? selectedModel : "Filter by model id..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search models..."
            value={searchQuery}
            onValueChange={onInputChange}
          />
          <CommandEmpty>No attribute found.</CommandEmpty>
          <CommandGroup>
            {modelIds.map((id: string) => (
              <CommandItem
                key={id}
                value={id}
                onSelect={(currentValue) => {
                  setSelectedModel(
                    currentValue === selectedModel ? "" : currentValue
                  );
                  setSelectedModel(
                    currentValue === selectedModel ? "" : currentValue
                  );
                  handleSelectmodel(currentValue);
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
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
