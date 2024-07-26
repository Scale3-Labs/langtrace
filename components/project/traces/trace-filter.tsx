import { Info } from "@/components/shared/info";
import { ModelCombobox } from "@/components/shared/model-combobox";
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
import { Separator } from "@/components/ui/separator";
import {
  HOW_TO_PROMPT_FETCHING,
  HOW_TO_USER_ID,
  OTEL_GENAI_ATTRIBUTES,
} from "@/lib/constants";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import { SpanAttributes } from "@/lib/ts_sdk_constants";
import ClearIcon from "@mui/icons-material/Clear";
import { Check, ChevronsUpDown, MinusCircle, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import VendorDropdown from "./vendor-dropdown";

export default function TraceFilter({
  open,
  onClose,
  filters,
  setFilters,
  userId,
  setUserId,
  promptId,
  setPromptId,
  model,
  setModel,
}: {
  open: boolean;
  onClose: () => void;
  filters: PropertyFilter[];
  setFilters: (filters: any) => void;
  userId: string;
  setUserId: (userId: string) => void;
  promptId: string;
  setPromptId: (promptId: string) => void;
  model: string;
  setModel: (model: string) => void;
}) {
  // TODO(Karthik): Commenting for now. Unsure if this is needed.
  // useEffect(() => {
  //   if (!open) {
  //     setFilters((prev: PropertyFilter[]) =>
  //       prev.filter(
  //         (filter) =>
  //           filter.value !== null &&
  //           filter.value !== undefined &&
  //           filter.value !== ""
  //       )
  //     );
  //   }
  // }, [open, setFilters]);

  const handleFilterChange = (
    filter: PropertyFilter,
    filterIndex: number = -1,
    remove: boolean = true
  ) => {
    setFilters((prev: any[]) => {
      // remove the filter
      if (filterIndex !== -1) {
        if (remove) {
          return prev.filter((_: any, index: number) => index !== filterIndex);
        }

        prev[filterIndex] = filter;
        return [...prev];
      }

      // check if the filter already exists
      const index = prev.findIndex(
        (prevFilter: { key: string; value: string }) =>
          prevFilter.key === filter.key && prevFilter.value === filter.value
      );

      if (index !== -1) {
        // remove the filter
        if (remove) {
          return prev.filter(
            (prevFilter: { key: string; value: string }) =>
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
    const f = [...filters];

    if (userId) {
      f.push({
        key: "user_id",
        operation: "EQUALS",
        value: userId,
        type: "attribute",
      });
    }

    if (promptId) {
      f.push({
        key: "prompt_id",
        operation: "EQUALS",
        value: promptId,
        type: "attribute",
      });
    }

    if (model) {
      f.push({
        key: "gen_ai.response.model",
        operation: "EQUALS",
        value: model,
        type: "attribute",
      });

      f.push({
        key: "gen_ai.request.model",
        operation: "EQUALS",
        value: model,
        type: "attribute",
      });
    }

    setFilters(f);
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
          selectedFilters={filters}
          handleFilterChange={handleFilterChange}
        />
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 items-center">
            <p className="text-sm font-semibold hover:underline">
              Filter by Model
            </p>
            <Info information="Langtrace automatically detects the models you are using in your application. When you use multiple models for your application, you can use this to filter spans and traces by models." />
          </div>
          <ModelCombobox
            selectedModel={model || ""}
            setSelectedModel={(mod) => {
              if (mod === model) {
                setModel("");
                filters.filter(
                  (filter) =>
                    filter.key !== "gen_ai.response.model" &&
                    filter.value !== mod
                );
              }
              setModel(mod);
            }}
          />
          <Separator />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 items-center">
            <p className="text-sm font-semibold hover:underline">
              Filter by User ID
            </p>
            <Info information="You can set up tracing to capture user IDs in your application. This filter will only show traces that have the specified user ID. To learn more about setting up tracing, check out our documentation." />
            <Link
              className="text-blue-600 text-xs underline"
              href={HOW_TO_USER_ID}
              target="_blank"
              rel="noreferrer, noopener"
            >
              Learn more
            </Link>
          </div>
          <UserCombobox
            selectedUser={userId}
            setSelectedUser={(uid) => {
              if (uid === userId) {
                setUserId("");
                filters.filter(
                  (filter) => filter.key !== "user_id" && filter.value !== uid
                );
              }
              setUserId(uid);
            }}
          />
          <Separator />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 items-center">
            <p className="text-sm font-semibold hover:underline">
              Filter by Prompt ID
            </p>
            <Info information="You can store, version and fetch prompts using Langtrace. This is helpful to keep track of all the prompts used and also to tie traces to prompts using the prompt ID for better debugging. To learn more about setting this up, check out our documentation." />
            <Link
              className="text-blue-600 text-xs underline"
              href={HOW_TO_PROMPT_FETCHING}
              target="_blank"
              rel="noreferrer, noopener"
            >
              Learn more
            </Link>
          </div>
          <PromptCombobox
            selectedPrompt={promptId}
            setSelectedPrompt={(pro) => {
              if (pro === promptId) {
                setPromptId("");
                filters.filter(
                  (filter) => filter.key !== "prompt_id" && filter.value !== pro
                );
              }
              setPromptId(pro);
            }}
          />
          <Separator />
        </div>
        <div>
          <p className="text-sm font-semibold hover:underline">
            Filter by Attributes
          </p>
          <div className="text-xs text-muted-foreground mt-3 mb-2">
            Attributes are key-value pairs that are attached to spans.
            Attributes capture useful information about the operation like the
            model API settings in the case of LLM API calls. You can filter
            traces based on these attributes. To learn more about attributes,
            check out the{" "}
            <span>
              <a
                href={OTEL_GENAI_ATTRIBUTES}
                target="_blank"
                rel="noreferrer, noopener"
                className="text-blue-600 underline"
              >
                OpenTelemetry specification here
              </a>
            </span>
            .
          </div>
          {filters.map((filter, index) => {
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
              setFilters((prev: PropertyFilter[]) => [
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
          <Separator className="mt-4" />
        </div>
        <DialogFooter className="sticky bottom-0 bg-primary-background py-2">
          <Button variant={"outline"} onClick={onClose}>
            Cancel
          </Button>
          {(filters.length > 0 ||
            userId !== "" ||
            promptId !== "" ||
            model !== "") && (
            <Button
              variant={"destructive"}
              onClick={() => {
                setFilters([]);
                setUserId("");
                setPromptId("");
                setModel("");
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
