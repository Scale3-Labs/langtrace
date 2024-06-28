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
import ClearIcon from "@mui/icons-material/Clear";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import { PromptCombobox } from "@/components/shared/prompt-combobox";
import { UserCombobox } from "@/components/shared/user-combobox";
import { SpanAttributes } from "@/lib/ts_sdk_constants";
import VendorDropdown from "./vendor-dropdown";

export default function FilterDialog({
  open,
  onClose,
  onApplyFilters,
}: {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");

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

  const handleFilterChange = (value: any) => {
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((e) => e !== value);
      }
      return [...prev, value];
    });
  };

  const applyFilters = () => {
    const validAdvancedFilters = advancedFilters.filter(
      (filter) =>
        filter.value !== null &&
        filter.value !== undefined &&
        filter.value !== ""
    );

    const convertedFilters = selectedFilters.map((filter) => ({
      key: "name",
      operation: "EQUALS",
      value: filter,
      type: "property",
    }));

    const convertedAdvancedFilters = validAdvancedFilters.map((filter) => ({
      key: filter.attribute,
      operation: filter.operator.toUpperCase().replace(" ", "_"),
      value: filter.value,
      type: "attribute",
    }));

    if (selectedUserId) {
      convertedAdvancedFilters.push({
        key: "user_id",
        operation: "EQUALS",
        value: selectedUserId,
        type: "attribute",
      });
    }

    if (selectedPromptId) {
      convertedAdvancedFilters.push({
        key: "prompt_id",
        operation: "EQUALS",
        value: selectedPromptId,
        type: "attribute",
      });
    }

    onApplyFilters({
      filters: [...convertedFilters, ...convertedAdvancedFilters],
    });
    onClose();
  };

  const addAdvancedFilter = () => {
    setAdvancedFilters([
      ...advancedFilters,
      { attribute: "", operator: "EQUALS", value: "" },
    ]);
  };

  const removeAdvancedFilter = (index: number) => {
    setAdvancedFilters(advancedFilters.filter((_, i) => i !== index));
  };

  const updateAdvancedFilter = (index: number, key: string, value: any) => {
    const updatedFilters = advancedFilters.map((filter, i) =>
      i === index ? { ...filter, [key]: value } : filter
    );
    setAdvancedFilters(updatedFilters);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Traces</DialogTitle>
          <DialogDescription>
            Select filters to apply to the traces.
          </DialogDescription>
        </DialogHeader>
        <VendorDropdown
          selectedFilters={selectedFilters}
          handleFilterChange={handleFilterChange}
        />
        <div>
          <h4 className="mt-4">Attributes</h4>
          {advancedFilters.map((filter, index) => (
            <div key={index} className="flex items-center mt-2 space-x-2">
              <AttributesCombobox
                initialAttribute={filter.attribute}
                setSelectedAttribute={(attribute) =>
                  updateAdvancedFilter(index, "attribute", attribute)
                }
              />
              <OperatorCombox
                initialOperator={filter.operator}
                setSelectedOperator={(operator) =>
                  updateAdvancedFilter(index, "operator", operator)
                }
              />
              <Input
                placeholder="Value"
                value={filter.value}
                onChange={(e) =>
                  updateAdvancedFilter(index, "value", e.target.value)
                }
                className="mr-2"
              />
              <Button
                variant={"destructive"}
                onClick={() => removeAdvancedFilter(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant={"secondary"}
            onClick={addAdvancedFilter}
            className="mt-2"
          >
            Add Attribute
          </Button>
        </div>
        <div>
          <h4 className="mt-4">User Id</h4>
          <UserCombobox
            selectedUser={selectedUserId}
            setSelectedUser={setSelectedUserId}
          />
        </div>
        <div>
          <h4 className="mt-4">Prompt Id</h4>
          <PromptCombobox
            selectedPrompt={selectedPromptId}
            setSelectedPrompt={setSelectedPromptId}
          />
        </div>
        <DialogFooter>
          <Button variant={"outline"} onClick={onClose}>
            Cancel
          </Button>
          {(selectedFilters.length > 0 ||
            advancedFilters.length > 0 ||
            selectedUserId !== "" ||
            selectedPromptId !== "") && (
            <Button
              variant={"destructive"}
              onClick={() => {
                setSelectedFilters([]);
                setAdvancedFilters([]);
                setSelectedUserId("");
                setSelectedPromptId("");
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
  const [selectedAttribute, setSelectedAttributeState] = useState(
    initialAttribute || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttributes = searchQuery
    ? SpanAttributes.filter((attribute) =>
        attribute.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : SpanAttributes.slice(0, 10);

  const onInputChange = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    setSelectedAttributeState(initialAttribute);
  }, [initialAttribute]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedAttribute ? selectedAttribute : "Select attribute..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search attribute..."
            value={searchQuery}
            onValueChange={onInputChange}
          />
          <CommandEmpty>No attribute found.</CommandEmpty>
          <CommandGroup>
            {filteredAttributes.map((attribute) => (
              <CommandItem
                key={attribute}
                value={attribute}
                onSelect={(currentValue) => {
                  setSelectedAttributeState(
                    currentValue === selectedAttribute ? "" : currentValue
                  );
                  setSelectedAttribute(
                    currentValue === selectedAttribute ? "" : currentValue
                  );
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedAttribute === attribute
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />
                {attribute}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OperatorCombox({
  setSelectedOperator,
  initialOperator,
}: {
  setSelectedOperator: (attribute: string) => void;
  initialOperator: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedOperator, setSelectedOperatorState] = useState(
    initialOperator.toLowerCase() || ""
  );

  const comparisonOperators = ["equals", "contains", "not equals"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedOperator ? selectedOperator : "Select operator..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandGroup>
            {comparisonOperators.map((operator) => (
              <CommandItem
                key={operator}
                value={operator}
                onSelect={(currentValue) => {
                  setSelectedOperatorState(
                    currentValue === selectedOperator ? "" : currentValue
                  );
                  setSelectedOperator(
                    currentValue === selectedOperator ? "" : currentValue
                  );
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedOperator === operator ? "opacity-100" : "opacity-0"
                  }`}
                />
                {operator.toLowerCase()}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
