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
import ClearIcon from "@mui/icons-material/Clear";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import { PromptCombobox } from "@/components/shared/prompt-combobox";
import { UserCombobox } from "@/components/shared/user-combobox";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { SpanAttributes } from "@/lib/ts_sdk_constants";
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

  const handleFilterChange = (filter: PropertyFilter) => {
    setAdvancedFilters((prev) => {
      const index = prev.findIndex(
        (prevFilter) =>
          prevFilter.key === filter.key && prevFilter.value === filter.value
      );
      if (index !== -1) {
        return prev.filter(
          (prevFilter) =>
            prevFilter.key !== filter.key || prevFilter.value !== filter.value
        );
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
          {/* {advancedFilters.map((filter, index) => (
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
          ))} */}
          {/* <Button
            variant={"secondary"}
            onClick={addAdvancedFilter}
            className="mt-2"
          >
            Add Attribute
          </Button> */}
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
  const [selectedAttribute, setSelectedAttributeState] = useState(
    initialAttribute || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttributes = searchQuery
    ? SpanAttributes.filter((attribute) =>
        attribute.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SpanAttributes;

  const onInputChange = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    setSelectedAttributeState(initialAttribute);
  }, [initialAttribute]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedAttribute ? selectedAttribute : "Select attribute..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 h-[250px] translate-x-[30px]">
        <Command>
          <CommandInput
            placeholder="Search attribute..."
            value={searchQuery}
            onValueChange={onInputChange}
          />
          <ScrollArea>
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
          </ScrollArea>
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
