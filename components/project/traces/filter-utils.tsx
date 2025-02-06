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
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpanAttributes } from "@/lib/ts_sdk_constants";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export function AttributesCombobox({
  setSelectedAttribute,
  initialAttribute,
}: {
  setSelectedAttribute: (attribute: string) => void;
  initialAttribute: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialAttribute || "");

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {value
            ? SpanAttributes.find((attr) => attr === value)
            : "Select attribute..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 h-[250px]">
        <Command>
          <CommandInput placeholder="Search attribute..." />
          <ScrollArea>
            <CommandEmpty>No attribute found.</CommandEmpty>
            <CommandGroup>
              {SpanAttributes.map((attribute) => (
                <CommandItem
                  key={attribute}
                  value={attribute}
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    setSelectedAttribute(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === attribute ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {attribute}
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OperatorCombobox({
  setSelectedOperator,
  initialOperator,
}: {
  setSelectedOperator: (
    attribute: "EQUALS" | "CONTAINS" | "NOT_EQUALS"
  ) => void;
  initialOperator: "EQUALS" | "CONTAINS" | "NOT_EQUALS";
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(
    initialOperator.toUpperCase() || "EQUALS"
  );

  const comparisonOperators = ["EQUALS", "CONTAINS", "NOT_EQUALS"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          {value
            ? comparisonOperators.find((op) => op === value)
            : "Select operator..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandGroup>
            {comparisonOperators.map((operator) => (
              <CommandItem
                key={operator}
                value={operator}
                onSelect={(currentValue) => {
                  setValue(currentValue.toUpperCase());
                  setSelectedOperator(
                    currentValue.toUpperCase() as
                      | "EQUALS"
                      | "CONTAINS"
                      | "NOT_EQUALS"
                  );
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === operator ? "opacity-100" : "opacity-0"
                  }`}
                />
                {operator}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
