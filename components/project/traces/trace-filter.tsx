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
import { useEffect, useState } from "react";

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
  const [selectedFilters, setSelectedFilters] = useState<FilterTypes[]>([]);
  const [showEvents, setShowEvents] = useState<boolean>(false);
  const [showOpenAI, setShowOpenAI] = useState<boolean>(false);
  const [showChromaDB, setShowChromaDB] = useState<boolean>(false);
  const [showPinecone, setShowPinecone] = useState<boolean>(false);
  const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);

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

  const filteredAttributes = searchQuery
    ? attributes
        .filter((attribute) =>
          attribute.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10)
    : attributes.slice(0, 10);

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
