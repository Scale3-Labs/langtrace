import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

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
import {
  anthropicModels,
  cohereModels,
  groqModels,
  openAIModels,
  perplexityModels,
} from "@/lib/types/playground_types";
import { cn } from "@/lib/utils";

export function ModelsDropDown({
  value,
  setValue,
  vendor,
}: {
  value: string;
  setValue: (value: string) => void;
  vendor: string;
}) {
  const [open, setOpen] = React.useState(false);
  let models = openAIModels;
  if (vendor === "anthropic") {
    models = anthropicModels;
  } else if (vendor === "cohere") {
    models = cohereModels;
  } else if (vendor === "groq") {
    models = groqModels;
  } else if (vendor === "perplexity") {
    models = perplexityModels;
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? models.find((model) => model.value === value)?.label
            : "Select model..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search model..." />
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandGroup>
            {models.map((model) => (
              <CommandItem
                key={model.value}
                value={model.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === model.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {model.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
