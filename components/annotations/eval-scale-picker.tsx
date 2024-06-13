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
import { cn } from "@/lib/utils";

export enum ScaleType {
  Range = "range",
}

export interface Scale {
  type: ScaleType;
  min: number;
  max: number;
  step?: number;
}

export default function EvalScalePicker({
  selectedScale,
  setSelectedScale,
}: {
  selectedScale: ScaleType | null;
  setSelectedScale: (scale: ScaleType) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full capitalize"
        >
          {selectedScale || "Select scale..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-full p-0">
        <Command>
          <CommandInput placeholder="Search scale..." />
          <CommandEmpty>No such scale found.</CommandEmpty>
          <CommandGroup>
            {Object.values(ScaleType).map((scale: ScaleType, i: number) => (
              <CommandItem
                className="capitalize"
                key={i}
                value={scale}
                onSelect={(selection: string) => {
                  setSelectedScale(selection as ScaleType);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 capitalize",
                    selectedScale === scale ? "opacity-100" : "opacity-0"
                  )}
                />
                {scale}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
