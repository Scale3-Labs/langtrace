import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SUPPORTED_VENDORS } from "@/lib/constants";
import { PropertyFilter } from "@/lib/services/query_builder_service";
import {
  EventsLocal,
  TracedFunctionsByVendorsLocal,
  VendorsLocal,
} from "@/lib/ts_sdk_constants";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function VendorDropdown({
  selectedFilters,
  handleFilterChange,
}: {
  selectedFilters: PropertyFilter[];
  handleFilterChange: (filter: PropertyFilter) => void;
}) {
  const [showFunctionFilters, setShowFunctionFilters] = useState(false);
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="vendors">
        <AccordionTrigger>Filter by Trace Vendor</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-row flex-wrap gap-4">
            {Object.keys(SUPPORTED_VENDORS).map((vendor) => (
              <div key={vendor} className="flex items-center">
                <Checkbox
                  id={vendor}
                  checked={selectedFilters.some(
                    (filter) =>
                      filter.value === SUPPORTED_VENDORS[vendor] &&
                      filter.key === "langtrace.service.name"
                  )}
                  value={SUPPORTED_VENDORS[vendor]}
                  onClick={() =>
                    handleFilterChange({
                      key: "langtrace.service.name",
                      operation: "EQUALS",
                      value: SUPPORTED_VENDORS[vendor],
                      type: "attribute",
                    })
                  }
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
        <p className="mt-4 text-sm font-semibold hover:underline">
          Filter by Vendor Function
        </p>
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
                        checked={selectedFilters.some(
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
                      <label htmlFor={method} className="ml-1 cursor-pointer">
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
            {EventsLocal.map((event) => (
              <div key={event} className="flex items-center">
                <Checkbox
                  id={event}
                  checked={selectedFilters.some(
                    (filter) => filter.value === event && filter.key === "name"
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
  );
}
