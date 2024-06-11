import { Checkbox } from "@/components/ui/checkbox";
import {
  SupportedVendors,
  TracedFunctionsByVendor,
  Vendors,
} from "@/lib/ts_sdk_constants";

import { ChevronDownIcon } from "@radix-ui/react-icons";

export default function VendorDropdown({
  toggleVendor,
  showVendor,
  selectedFilters,
  handleFilterChange,
}: {
  toggleVendor: (vendor: keyof typeof Vendors) => void;
  showVendor: { [key: string]: boolean };
  selectedFilters: string[];
  handleFilterChange: (method: string) => void;
}) {
  return (Object.keys(Vendors) as Array<keyof typeof Vendors>).map((vendor) => (
    <div key={vendor}>
      <h4
        onClick={() => {
          toggleVendor(vendor);
        }}
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
  ));
}
