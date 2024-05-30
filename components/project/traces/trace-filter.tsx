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
} from "@/components/ui/dialog"; // Adjust the import path as needed
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChromaDBMethods,
  Event,
  OpenAIMethods,
  PineconeMethods,
} from "@langtrase/trace-attributes";
import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

type FilterTypes = Event | OpenAIMethods | ChromaDBMethods | PineconeMethods;

export function FilterDialog({
  open,
  onClose,
  onApplyFilters,
}: {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}) {
  const [selectedFilters, setSelectedFilters] = React.useState<FilterTypes[]>(
    []
  );
  const [showEvents, setShowEvents] = React.useState<boolean>(false);
  const [showOpenAI, setShowOpenAI] = React.useState<boolean>(false);
  const [showChromaDB, setShowChromaDB] = React.useState<boolean>(false);
  const [showPinecone, setShowPinecone] = React.useState<boolean>(false);
  const [advancedFilters, setAdvancedFilters] = React.useState<any[]>([]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as FilterTypes;
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((e) => e !== value);
      }
      return [...prev, value];
    });
  };

  const applyFilters = () => {
    onApplyFilters({
      filters: selectedFilters,
      advancedFilters,
    });
    onClose();
  };

  const addAdvancedFilter = () => {
    setAdvancedFilters([
      ...advancedFilters,
      { attribute: "", operator: "equals", value: "" },
    ]);
  };

  const comparisonOperators = ["equals", "greater than", "less than", "like"];

  const removeAdvancedFilter = (index: number) => {
    setAdvancedFilters(advancedFilters.filter((_, i) => i !== index));
  };

  const updateAdvancedFilter = (index: number, key: string, value: any) => {
    const updatedFilters = advancedFilters.map((filter, i) =>
      i === index ? { ...filter, [key]: value } : filter
    );
    setAdvancedFilters(updatedFilters);
  };

  const handleAttributeChange =
    (index: number) => (event: React.ChangeEvent<{ value: unknown }>) => {
      updateAdvancedFilter(index, "attribute", event.target.value as string);
    };

  const handleOperatorChange =
    (index: number) => (event: React.ChangeEvent<{ value: unknown }>) => {
      updateAdvancedFilter(index, "operator", event.target.value as string);
    };

  const handleValueChange =
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      updateAdvancedFilter(index, "value", event.target.value);
    };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(event)}
                    onChange={handleFilterChange}
                    value={event}
                  />
                }
                label={event}
                key={event}
              />
            ))}
        </div>
        <div>
          <h4
            onClick={() => setShowOpenAI(!showOpenAI)}
            className="cursor-pointer flex items-center"
          >
            OpenAI
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showOpenAI &&
            Object.values(OpenAIMethods).map((method) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(method)}
                    onChange={handleFilterChange}
                    value={method}
                  />
                }
                label={method}
                key={method}
              />
            ))}
        </div>
        <div>
          <h4
            onClick={() => setShowChromaDB(!showChromaDB)}
            className="cursor-pointer flex items-center"
          >
            ChromaDB
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showChromaDB &&
            Object.values(ChromaDBMethods).map((method) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(method)}
                    onChange={handleFilterChange}
                    value={method}
                  />
                }
                label={method}
                key={method}
              />
            ))}
        </div>
        <div>
          <h4
            onClick={() => setShowPinecone(!showPinecone)}
            className="cursor-pointer flex items-center"
          >
            Pinecone
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </h4>
          {showPinecone &&
            Object.values(PineconeMethods).map((method) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFilters.includes(method)}
                    onChange={handleFilterChange}
                    value={method}
                  />
                }
                label={method}
                key={method}
              />
            ))}
        </div>
        <div>
          <h4 className="mt-4">Advanced Filters</h4>
          {advancedFilters.map((filter, index) => (
            <div key={index} className="flex items-center mt-2">
              {/* <TextField
                select
                label="Attribute"
                value={filter.attribute}
                onChange={handleAttributeChange(index)}
                className="mr-2"
                fullWidth
              > */}
              <AttributesCombobox
                setSelectedAttribute={(attribute) =>
                  updateAdvancedFilter(index, "attribute", attribute)
                }
              />
              {/* </TextField> */}
              <TextField
                select
                label="Operator"
                value={filter.operator}
                onChange={(e) =>
                  updateAdvancedFilter(index, "operator", e.target.value)
                }
                className="mr-2"
                fullWidth
              >
                {comparisonOperators.map((op) => (
                  <MenuItem key={op} value={op}>
                    {op}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Value"
                value={filter.value}
                onChange={(e) =>
                  updateAdvancedFilter(index, "value", e.target.value)
                }
                className="mr-2"
                fullWidth
              />
              <Button onClick={() => removeAdvancedFilter(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button onClick={addAdvancedFilter} className="mt-2">
            Add Advanced Filter
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
}: {
  setSelectedAttribute: (attribute: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedAttribute, setSelectedAttributeState] = React.useState("");
  const attributes = [
    "langtrace.service.name",
    "langtrace.service.type",
    "langtrace.service.version",
    "langtrace.sdk.name",
    "langtrace.version",
    "server.address",
    "db.operation",
    "db.system",
    "db.namespace",
    "db.index",
    "db.collection.name",
    "db.pinecone.top_k",
    "db.chromadb.embedding_model",
    "user.id",
    "user.feedback.rating",
    "langtrace.testId",
    "langchain.task.name",
    "langchain.inputs",
    "langchain.outputs",
    "llamaindex.task.name",
    "llamaindex.inputs",
    "llamaindex.outputs",
    "url.full",
    "llm.api",
    "llm.model",
    "llm.temperature",
    "llm.top_p",
    "llm.top_k",
    "llm.user",
    "llm.system.fingerprint",
    "llm.prompts",
    "llm.function.prompts",
    "llm.responses",
    "llm.token.counts",
    "llm.stream",
    "llm.encoding.format",
    "llm.dimensions",
    "llm.generation_id",
    "llm.response_id",
    "llm.citations",
    "llm.documents",
    "llm.is_search_required",
    "llm.search_results",
    "llm.tool_calls",
    "llm.max_tokens",
    "llm.max_input_tokens",
    "llm.conversation_id",
    "llm.seed",
    "llm.frequency_penalty",
    "llm.presence_penalty",
    "llm.connectors",
    "llm.tools",
    "llm.tool_results",
    "llm.embedding_dataset_id",
    "llm.embedding_input_type",
    "llm.embedding_job_name",
    "http.max.retries",
    "http.timeout",
  ];

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
          <CommandInput placeholder="Search attribute..." />
          <CommandEmpty>No attribute found.</CommandEmpty>
          <CommandGroup>
            {attributes.map((attribute) => (
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
}: {
  setSelectedOperator: (attribute: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedOperator, setSelectedOperatorState] = React.useState("");

  const comparisonOperators = ["equals", "greater than", "less than", "like"];

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
          {/* <CommandInput placeholder="Search attribute..." /> */}
          {/* <CommandEmpty>No attribute found.</CommandEmpty> */}
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

export default FilterDialog;
