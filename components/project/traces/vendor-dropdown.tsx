import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Events,
  SupportedVendors,
  TracedFunctionsByVendor,
  Vendors,
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
          {Events.map((event) => (
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
      {(Object.keys(Vendors) as Array<keyof typeof Vendors>).map((vendor) => (
        <AccordionItem key={vendor} value={vendor}>
          <AccordionTrigger>{Vendors[vendor]}</AccordionTrigger>
          <AccordionContent>
            {TracedFunctionsByVendor[vendor as SupportedVendors].map(
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
