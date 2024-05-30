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
} from "@/components/ui/dialog"; // Adjust the import path as needed
import { Input } from "@/components/ui/input";
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
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

type FilterTypes = Event | OpenAIMethods | ChromaDBMethods | PineconeMethods;

export default function FilterDialog({
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
  const [selectedAttributeType, setSelectedAttributeType] =
    React.useState("string");

  const handleFilterChange = (value: any) => {
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((e) => e !== value);
      }
      return [...prev, value];
    });
  };

  console.log(selectedFilters);
  console.log(advancedFilters);

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

  const removeAdvancedFilter = (index: number) => {
    setAdvancedFilters(advancedFilters.filter((_, i) => i !== index));
  };

  const updateAdvancedFilter = (index: any, field: any, value: any) => {
    const updatedFilters = advancedFilters.map((filter, i) =>
      i === index ? { ...filter, [field]: value } : filter
    );
    setAdvancedFilters(updatedFilters);
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
              <div key={method} className="flex items-center">
                <Checkbox
                  checked={selectedFilters.includes(method)}
                  onClick={() => handleFilterChange(method)}
                  value={method}
                />

                <label className="ml-2">{method}</label>
              </div>
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
              <div key={method} className="flex items-center">
                <Checkbox
                  checked={selectedFilters.includes(method)}
                  onClick={() => handleFilterChange(method)}
                  value={method}
                />

                <label className="ml-2">{method}</label>
              </div>
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
              <div key={method} className="flex items-center">
                <Checkbox
                  checked={selectedFilters.includes(method)}
                  onClick={() => handleFilterChange(method)}
                  value={method}
                />

                <label className="ml-2">{method}</label>
              </div>
            ))}
        </div>
        <div>
          <h4 className="mt-4">Advanced Filters</h4>
          {advancedFilters.map((filter, index) => (
            <div key={index} className="flex items-center mt-2 space-x-2">
              <AttributesCombobox
                setSelectedAttribute={(attribute) =>
                  updateAdvancedFilter(index, "attribute", attribute)
                }
                setSelectedAttributeType={setSelectedAttributeType}
              />
              <OperatorCombox
                selectedAttributeType={selectedAttributeType}
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
  setSelectedAttributeType,
}: {
  setSelectedAttribute: (attribute: string) => void;
  setSelectedAttributeType: (type: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedAttribute, setSelectedAttributeState] = React.useState("");
  const attributes = [
    { name: "langtrace.service.name", type: "string" },
    { name: "langtrace.service.type", type: "string" },
    { name: "langtrace.service.version", type: "string" },
    { name: "langtrace.sdk.name", type: "string" },
    { name: "langtrace.version", type: "string" },
    { name: "server.address", type: "string" },
    { name: "db.operation", type: "string" },
    { name: "db.system", type: "string" },
    { name: "db.namespace", type: "string" },
    { name: "db.index", type: "string" },
    { name: "db.collection.name", type: "string" },
    { name: "db.pinecone.top_k", type: "number" },
    { name: "db.chromadb.embedding_model", type: "string" },
    { name: "user.id", type: "string" },
    { name: "user.feedback.rating", type: "number" },
    { name: "langtrace.testId", type: "string" },
    { name: "langchain.task.name", type: "string" },
    { name: "langchain.inputs", type: "string" },
    { name: "langchain.outputs", type: "string" },
    { name: "llamaindex.task.name", type: "string" },
    { name: "llamaindex.inputs", type: "string" },
    { name: "llamaindex.outputs", type: "string" },
    { name: "url.full", type: "string" },
    { name: "llm.api", type: "string" },
    { name: "llm.model", type: "string" },
    { name: "llm.temperature", type: "number" },
    { name: "llm.top_p", type: "number" },
    { name: "llm.top_k", type: "number" },
    { name: "llm.user", type: "string" },
    { name: "llm.system.fingerprint", type: "string" },
    { name: "llm.prompts", type: "string" },
    { name: "llm.function.prompts", type: "string" },
    { name: "llm.responses", type: "string" },
    { name: "llm.token.counts", type: "string" },
    { name: "llm.stream", type: "boolean" },
    { name: "llm.encoding.format", type: "string" },
    { name: "llm.dimensions", type: "string" },
    { name: "llm.generation_id", type: "string" },
    { name: "llm.response_id", type: "string" },
    { name: "llm.citations", type: "string" },
    { name: "llm.documents", type: "string" },
    { name: "llm.is_search_required", type: "boolean" },
    { name: "llm.search_results", type: "string" },
    { name: "llm.tool_calls", type: "string" },
    { name: "llm.max_tokens", type: "string" },
    { name: "llm.max_input_tokens", type: "string" },
    { name: "llm.conversation_id", type: "string" },
    { name: "llm.seed", type: "string" },
    { name: "llm.frequency_penalty", type: "string" },
    { name: "llm.presence_penalty", type: "string" },
    { name: "llm.connectors", type: "string" },
    { name: "llm.tools", type: "string" },
    { name: "llm.tool_results", type: "string" },
    { name: "llm.embedding_dataset_id", type: "string" },
    { name: "llm.embedding_input_type", type: "string" },
    { name: "llm.embedding_job_name", type: "string" },
    { name: "http.max.retries", type: "number" },
    { name: "http.timeout", type: "number" },
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
                key={attribute.name}
                value={attribute.name}
                onSelect={(currentValue) => {
                  const selected = attributes.find(
                    (attr) => attr.name === currentValue
                  );
                  setSelectedAttributeState(
                    currentValue === selectedAttribute ? "" : currentValue
                  );
                  setSelectedAttribute(
                    currentValue === selectedAttribute ? "" : currentValue
                  );
                  setSelectedAttributeType(selected ? selected.type : "string");
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedAttribute === attribute.name
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />
                {attribute.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OperatorCombox({
  selectedAttributeType,
  setSelectedOperator,
}: {
  selectedAttributeType: string;
  setSelectedOperator: (attribute: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedOperator, setSelectedOperatorState] = React.useState("");

  const comparisonOperators: Record<string, string[]> = {
    string: ["like"],
    number: ["equals", "greater than", "less than"],
    boolean: ["equals"],
  };

  const operators =
    comparisonOperators[
      selectedAttributeType as keyof typeof comparisonOperators
    ] || [];

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
            {operators.map((operator) => (
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
