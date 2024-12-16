import { Info } from "@/components/shared/info";
import { ModelCombobox } from "@/components/shared/model-combobox";
import { PromptCombobox } from "@/components/shared/prompt-combobox";
import { UserCombobox } from "@/components/shared/user-combobox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  HOW_TO_PROMPT_FETCHING,
  HOW_TO_USER_ID,
  OTEL_GENAI_ATTRIBUTES,
  OTEL_GENAI_EVENTS,
  SUPPORTED_VENDORS,
} from "@/lib/constants";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import {
  EventsLocal,
  TracedFunctionsByVendorsLocal,
  VendorsLocal,
} from "@/lib/ts_sdk_constants";
import { cn } from "@/lib/utils";
import ClearIcon from "@mui/icons-material/Clear";
import {
  ChevronDown,
  ListFilterIcon,
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AttributesCombobox, OperatorCombobox } from "./filter-utils";

const FILTERS: { key: string; value: string; info: string }[] = [
  {
    key: "llm",
    value: "LLM Requests",
    info: "Requests made to a LLM. This includes requests like text embedding, text generation, text completion, etc.",
  },
  {
    key: "vectordb",
    value: "VectorDB Requests",
    info: "Requests made to a VectorDB. This includes requests like vector search, vector similarity, etc.",
  },
  {
    key: "framework",
    value: "Framework Requests",
    info: "This includes traces from Framework calls like langchain, CrewAI, DSPy etc.",
  },
];

export function FilterSheet({
  utcTime,
  setUtcTime,
  expandedView,
  group,
  setExpandedView,
  setGroup,
  setPage,
  setEnableFetch,
  filters,
  setFilters,
  showBottomLoader,
  userId,
  setUserId,
  promptId,
  setPromptId,
  model,
  setModel,
}: {
  utcTime: boolean;
  setUtcTime: (utcTime: boolean) => void;
  expandedView: boolean;
  group: boolean;
  setExpandedView: (expandedView: boolean) => void;
  setGroup: (group: boolean) => void;
  setPage: (page: number) => void;
  setEnableFetch: (enableFetch: boolean) => void;
  filters: any[];
  setFilters: any;
  showBottomLoader: boolean;
  userId: string;
  setUserId: (userId: string) => void;
  promptId: string;
  setPromptId: (promptId: string) => void;
  model: string;
  setModel: (model: string) => void;
}) {
  const [showFunctionFilters, setShowFunctionFilters] = useState(false);

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
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <ListFilterIcon className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Filter the traces by the following criteria.
          </SheetDescription>
        </SheetHeader>
        <Accordion
          type="single"
          defaultValue="item-2"
          collapsible
          className="w-full mt-8"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Preferences</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center w-full">
                  <p className="text-xs font-semibold">Local time</p>
                  <Switch
                    className="text-start"
                    id="timestamp"
                    checked={utcTime}
                    onCheckedChange={(check) => {
                      setUtcTime(check);

                      // Save the preference in local storage
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                          "preferences.timestamp.utc",
                          check ? "true" : "false"
                        );
                        toast.success("Preferences updated.");
                      }
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold">UTC</p>
                    <Info information="By default all the spans are recorded in UTC timezone for the sake of standardization. By toggling this setting, you can visualize the spans in your local timezone." />
                  </div>
                </div>
                <div className="flex gap-2 items-center w-full">
                  <p className="text-xs font-semibold">Compress</p>
                  <Switch
                    className="text-start"
                    id="expanded"
                    checked={expandedView}
                    onCheckedChange={(check) => {
                      setExpandedView(check);

                      // Save the preference in local storage
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                          "preferences.expanded",
                          check ? "true" : "false"
                        );
                        toast.success("Preferences updated.");
                      }
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold">Expand</p>
                    <Info information="By default, the input and output messages are compressed to fit the table. By toggling this setting, you can expand the input and output messages to view the complete content." />
                  </div>
                </div>
                <div className="flex gap-2 items-center w-full">
                  <p className="text-xs font-semibold">Don&apos;t group</p>
                  <Switch
                    className="text-start"
                    id="group"
                    checked={group}
                    onCheckedChange={(check) => {
                      setGroup(check);
                      setPage(1);
                      setEnableFetch(true);

                      // Save the preference in local storage
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                          "preferences.group",
                          check ? "true" : "false"
                        );
                        toast.success("Preferences updated.");
                      }
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold">Group</p>
                    <Info information="By default, the spans are grouped if they are part of a single trace with a common parent. By toggling this setting, you can view spans individually without any relationships." />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Quick Filters</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-6">
                {FILTERS.map((item, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox
                      disabled={showBottomLoader}
                      id={item.key}
                      checked={filters.some(
                        (filter) => filter.value === item.key
                      )}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilters([
                            ...filters,
                            {
                              key: "langtrace.service.type",
                              operation: "EQUALS",
                              value: item.key,
                              type: "attribute",
                            },
                          ]);
                        } else {
                          setFilters(
                            filters.filter(
                              (filter) => filter.value !== item.key
                            )
                          );
                        }
                      }}
                    />
                    <label htmlFor={item.key} className="text-xs font-semibold">
                      {item.value}
                    </label>
                    <Info information={item.info} />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <div className="flex flex-col gap-4 mt-2">
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
          <div className="flex flex-col gap-4 mt-2">
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
          <div className="flex flex-col gap-4 mt-2">
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
                    (filter) =>
                      filter.key !== "prompt_id" && filter.value !== pro
                  );
                }
                setPromptId(pro);
              }}
            />
            <Separator />
          </div>
          <div className="mt-2">
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
              size="sm"
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
          <AccordionItem value="vendors">
            <AccordionTrigger>Filter by Vendor</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-row flex-wrap gap-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Vendors are the SDKs that are used to instrument the code.
                  Vendors include LLMs, VectorDBs and frameworks such as
                  Langchain, CrewAI etc.
                </p>
                {Object.keys(SUPPORTED_VENDORS).map((vendor) => (
                  <div key={vendor} className="flex items-center">
                    <Checkbox
                      id={vendor}
                      checked={filters.some(
                        (filter) =>
                          filter.value === SUPPORTED_VENDORS[vendor] &&
                          filter.key === "langtrace.service.name"
                      )}
                      value={SUPPORTED_VENDORS[vendor]}
                      onClick={() => {
                        handleFilterChange({
                          key: "langtrace.service.name",
                          operation: "EQUALS",
                          value: SUPPORTED_VENDORS[vendor],
                          type: "attribute",
                        });
                        handleFilterChange({
                          key: "langtrace.service.name",
                          operation: "EQUALS",
                          value: SUPPORTED_VENDORS[vendor].toLowerCase(),
                          type: "attribute",
                        });
                      }}
                    />
                    <label htmlFor={vendor} className="ml-1 cursor-pointer">
                      {SUPPORTED_VENDORS[vendor]}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <button
            className={cn(
              "flex items-end justify-between cursor-pointer w-full",
              showFunctionFilters ? "mb-6" : "mb-4"
            )}
            onClick={() => setShowFunctionFilters(!showFunctionFilters)}
          >
            <div className="mt-4 flex gap-1 items-center">
              <p className=" text-sm font-semibold hover:underline">
                Filter by Vendor Function
              </p>
              <Info information="Vendor functions are the functions that are provided by the vendor's SDK. The spans that are part of a trace are identified by default with the vendor function as the name." />
            </div>
            {!showFunctionFilters && (
              <ChevronDown className="cursor-pointer h-4 w-4 text-muted-foreground" />
            )}
            {showFunctionFilters && (
              <ChevronDown className="cursor-pointer h-4 w-4 text-muted-foreground transform rotate-180" />
            )}
          </button>
          {showFunctionFilters &&
            Object.values(VendorsLocal).map((vendor) => (
              <AccordionItem key={vendor} value={vendor}>
                <AccordionTrigger>{vendor}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-row flex-wrap gap-4">
                    {TracedFunctionsByVendorsLocal[vendor as VendorsLocal].map(
                      (method: any) => (
                        <div key={method} className="flex items-center">
                          <Checkbox
                            id={method}
                            checked={filters.some(
                              (filter) =>
                                filter.value === method && filter.key === "name"
                            )}
                            value={method}
                            onClick={() => {
                              handleFilterChange({
                                key: "name",
                                operation: "CONTAINS",
                                value: method,
                                type: "property",
                              });
                            }}
                          />
                          <label
                            htmlFor={method}
                            className="ml-1 cursor-pointer"
                          >
                            {method}
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          <Separator />
          <AccordionItem value="events">
            <AccordionTrigger>Filter by Events</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-row flex-wrap gap-4">
                <div className="text-xs text-muted-foreground mb-2">
                  Events are part of the OpenTelemetry specification. In the
                  context of Langtrace, events are the logs that are generated
                  by the code. Events are used to track the prompt and response
                  content in the case of LLMs. To learn more about events, refer
                  to the official{" "}
                  <span>
                    <a
                      href={OTEL_GENAI_EVENTS}
                      target="_blank"
                      rel="noreferrer, noopener"
                      className="text-blue-600 underline"
                    >
                      OpenTelemetry specification here
                    </a>
                  </span>
                  .
                </div>
                {EventsLocal.map((event) => (
                  <div key={event} className="flex items-center">
                    <Checkbox
                      id={event}
                      checked={filters.some(
                        (filter) =>
                          filter.value === event && filter.key === "name"
                      )}
                      value={event}
                      onClick={() => {
                        handleFilterChange({
                          key: "name",
                          operation: "EQUALS",
                          value: event,
                          type: "event",
                        });
                      }}
                    />
                    <label htmlFor={event} className="ml-1 cursor-pointer">
                      {event}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="sticky bottom-0 py-2 flex gap-4 mt-4">
          <Button
            variant={"default"}
            onClick={applyFilters}
            className="bg-blue-700 text-white hover:bg-blue-800"
          >
            Apply Filters
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
