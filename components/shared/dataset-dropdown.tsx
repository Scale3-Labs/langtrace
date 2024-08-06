import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";

export function DatasetDropdown({
  projectId,
  datasetId,
  setDatasetId,
}: {
  projectId: string;
  datasetId: string;
  setDatasetId: (datasetId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const {
    data: datasets,
    isLoading: datasetsLoading,
    error: datasetsError,
  } = useQuery({
    queryKey: ["fetch-datasets-stats-query", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/stats/dataset?id=${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to fetch datasets");
      }
      const result = await response.json();
      return result;
    },
    onError: (error) => {
      toast.error("Failed to fetch datasets", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  if (datasetsLoading || datasetsError) {
    return <Skeleton className="w-[200px] h-10" />;
  } else {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {datasetId
              ? datasets.result.find(
                  (dataset: any) => dataset?.dataset?.id === datasetId
                )?.dataset?.name
              : "Select dataset..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search dataset..." />
            <CommandList>
              <CommandEmpty>No dataset found.</CommandEmpty>
              <CommandGroup>
                {datasets.result.map((dataset: any) => (
                  <CommandItem
                    key={dataset?.dataset?.id}
                    value={dataset?.dataset?.id}
                    onSelect={(currentValue) => {
                      setDatasetId(
                        currentValue === datasetId ? "" : currentValue
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        datasetId === dataset?.dataset?.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {dataset?.dataset?.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
}
