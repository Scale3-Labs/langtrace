import { PromptCombobox } from "@/components/shared/prompt-combobox";
import { UserCombobox } from "@/components/shared/user-combobox";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { SpanAttributes } from "@/lib/ts_sdk_constants";
import ClearIcon from "@mui/icons-material/Clear";
import { Check, ChevronsUpDown, MinusCircle, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import VendorDropdown from "./vendor-dropdown";

export default function FilterDialog({
  open,
  onClose,
  onApplyFilters,
}: {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: PropertyFilter[]) => void;
}) {
  const [advancedFilters, setAdvancedFilters] = useState<PropertyFilter[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [promptId, setPromptId] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setAdvancedFilters((filters) =>
        filters.filter(
          (filter) =>
            filter.value !== null &&
            filter.value !== undefined &&
            filter.value !== ""
        )
      );
    }
  }, [open]);

  const handleFilterChange = (
    filter: PropertyFilter,
    filterIndex: number = -1,
    remove: boolean = true
  ) => {
    setAdvancedFilters((prev) => {
      // remove the filter
      if (filterIndex !== -1) {
        if (remove) {
          return prev.filter((_, index) => index !== filterIndex);
        }

        prev[filterIndex] = filter;
        return [...prev];
      }

      // check if the filter already exists
      const index = prev.findIndex(
        (prevFilter) =>
          prevFilter.key === filter.key && prevFilter.value === filter.value
      );

      if (index !== -1) {
        // remove the filter
        if (remove) {
          return prev.filter(
            (prevFilter) =>
              prevFilter.key !== filter.key || prevFilter.value !== filter.value
          );
        }

        // replace the filter
        prev[index] = filter;
        return [...prev];
      }
      return [...prev, filter];
    });
  };

  const applyFilters = () => {
    const filters = [...advancedFilters];

    if (userId) {
      filters.push({
        key: "user_id",
        operation: "EQUALS",
        value: userId,
        type: "attribute",
      });
    }

    if (promptId) {
      filters.push({
        key: "prompt_id",
        operation: "EQUALS",
        value: promptId,
        type: "attribute",
      });
    }

    onApplyFilters(filters);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-y-scroll flex flex-col py-4">
        <DialogHeader>
          <DialogTitle>Filter Traces</DialogTitle>
          <DialogDescription>
            Filter traces by various attributes
          </DialogDescription>
        </DialogHeader>
        <VendorDropdown
          selectedFilters={advancedFilters}
          handleFilterChange={handleFilterChange}
        />
        <div>
          <h4 className="mt-4">Attributes</h4>
          {advancedFilters.map((filter, index) => {
            if (filter.type !== "attribute") return null;
            return (
              <div key={index} className="flex items-center mt-2 gap-2">
                <AttributesCombobox
                  initialAttribute={filter.key}
                  setSelectedAttribute={(attribute) => {
                    handleFilterChange(
                      { ...filter, key: attribute },
                      index,
                      false
                    );
                  }}
                />
                <OperatorCombobox
                  initialOperator={filter.operation}
                  setSelectedOperator={(operator) => {
                    handleFilterChange(
                      { ...filter, operation: operator },
                      index,
                      false
                    );
                  }}
                />
                <Input
                  placeholder="Value"
                  value={filter.value}
                  onChange={(e) => {
                    handleFilterChange(
                      { ...filter, value: e.target.value },
                      index,
                      false
                    );
                  }}
                  className="mr-2 w-48"
                />
                <Button
                  size="icon"
                  variant={"destructive"}
                  onClick={() => {
                    handleFilterChange(filter, index, true);
                  }}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <Button
            variant={"default"}
            onClick={() => {
              setAdvancedFilters((prev) => [
                ...prev,
                {
                  key: "",
                  operation: "EQUALS",
                  value: "",
                  type: "attribute",
                },
              ]);
            }}
            className="mt-3"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
        </div>
        <div>
          <h4 className="mt-4">User Id</h4>
          <UserCombobox selectedUser={userId} setSelectedUser={setUserId} />
        </div>
        <div>
          <h4 className="mt-4">Prompt Id</h4>
          <PromptCombobox
            selectedPrompt={promptId}
            setSelectedPrompt={setPromptId}
          />
        </div>
        <DialogFooter className="sticky bottom-0 bg-primary-background py-4">
          <Button variant={"outline"} onClick={onClose}>
            Cancel
          </Button>
          {(advancedFilters.length > 0 || userId !== "" || promptId !== "") && (
            <Button
              variant={"destructive"}
              onClick={() => {
                setAdvancedFilters([]);
                setUserId("");
                setPromptId("");
              }}
            >
              <ClearIcon className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
          <Button variant={"default"} onClick={applyFilters} color="primary">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
