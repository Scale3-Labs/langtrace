"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import { SpanAttributes } from "@/lib/ts_sdk_constants";
import VendorDropdown from "./vendor-dropdown";
// import { Event } from "@langtrase/typescript-sdk";

type FilterTypes = string;

export default function FilterDialog({
  open,
  onClose,
  onApplyFilters,
}: {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}) {
  const [selectedFilters, setSelectedFilters] = useState<FilterTypes[]>([]);
  const [showEvents, setShowEvents] = useState<boolean>(false);
  const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);
  const [showVendor, setShowVendor] = useState<{ [key: string]: boolean }>({});

  const handleFilterChange = (value: any) => {
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((e) => e !== value);
      }
      return [...prev, value];
    });
  };

  const applyFilters = () => {
    const convertedFilters = selectedFilters.map((filter) => ({
      key: "name",
      operation: "EQUALS",
      value: filter,
      type: "property",
    }));

    const convertedAdvancedFilters = advancedFilters.map((filter) => ({
      key: filter.attribute,
      operation: filter.operator.toUpperCase().replace(" ", "_"),
      value: filter.value,
      type: "attribute",
    }));

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

  const toggleVendor = (vendor: string) => {
    setShowVendor((prev) => ({ ...prev, [vendor]: !prev[vendor] }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Filter Traces</DialogTitle>
          <DialogDescription>
            Select filters to apply to the traces.
          </DialogDescription>
        </DialogHeader>
        <div>
          <h4
            onClick={() => setShowEvents(!showEvents)}
            className="cursor-pointer flex items-center"
          >
            Events
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showEvents &&
            Object.values(Event).map((event) => (
              <div key={event} className="flex items-center">
                <Checkbox
                  checked={selectedFilters.includes(event)}
                  value={event}
                  onClick={() => handleFilterChange(event)}
                />
                <label className="ml-2">{event}</label>
              </div>
            ))}
        </div>
        {/* {(Object.keys(Vendors) as Array<keyof typeof Vendors>).map((vendor) => (
          <div key={vendor}>
            <h4
              onClick={() => toggleVendor(vendor)}
              className="cursor-pointer flex items-center"
            >
              {Vendors[vendor]}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </h4>
            {showVendor[vendor] &&
              TracedFunctionsByVendor[vendor as SupportedVendors].map(
                (method: any) => (
                  <div key={method} className="flex items-center">
                    <Checkbox
                      checked={selectedFilters.includes(method)}
                      onClick={() => handleFilterChange(method)}
                      value={method}
                    />
                    <label className="ml-2">{method}</label>
                  </div>
                )
              )}
          </div>
        ))} */}
        <VendorDropdown
          toggleVendor={toggleVendor}
          showVendor={showVendor}
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
              <Button onClick={() => removeAdvancedFilter(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button onClick={addAdvancedFilter} className="mt-2">
            Add Attribute
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={applyFilters} color="primary">
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
    initialOperator || ""
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
                {operator}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
