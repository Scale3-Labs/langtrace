import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EventsLocal,
  TracedFunctionsByVendorsLocal,
  VendorsLocal,
} from "@/lib/ts_sdk_constants";

export default function VendorDropdown({
  selectedFilters,
  handleFilterChange,
}: {
  selectedFilters: string[];
  handleFilterChange: (method: string) => void;
}) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="events">
        <AccordionTrigger>events</AccordionTrigger>
        <AccordionContent>
          {EventsLocal.map((event) => (
            <div key={event} className="flex items-center">
              <Checkbox
                checked={selectedFilters.includes(event)}
                value={event}
                onClick={() => handleFilterChange(event)}
              />
              <label className="ml-2">{event}</label>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
      {Object.values(VendorsLocal).map((vendor) => (
        <AccordionItem key={vendor} value={vendor}>
          <AccordionTrigger>{vendor}</AccordionTrigger>
          <AccordionContent>
            {TracedFunctionsByVendorsLocal[vendor as VendorsLocal].map(
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
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
