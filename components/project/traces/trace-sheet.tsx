import TraceGraph from "@/components/traces/trace_graph";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trace } from "@/lib/trace_util";
import {
  calculateTotalTime,
  convertTracesToHierarchy,
} from "@/lib/trace_utils";
import { getVendorFromSpan } from "@/lib/utils";
import { useEffect, useState } from "react";

export function TraceSheet({
  trace,
  open,
  setOpen,
}: {
  trace: Trace;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [selectedTrace, setSelectedTrace] = useState<any[]>(
    trace.trace_hierarchy
  );
  const [selectedVendors, setSelectedVendors] = useState<string[]>(
    trace.vendors
  );

  useEffect(() => {
    setSelectedTrace(trace.trace_hierarchy);
    setSelectedVendors(trace.vendors);
  }, [trace, open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-3/4">
        <SheetHeader>
          <SheetTitle>Trace Details</SheetTitle>
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              <li className="text-xs font-semibold text-muted-foreground">
                Tip 1: Hover over any span line to see additional attributes and
                events. Attributes contain the request parameters and events
                contain logs and errors.
              </li>
              <li className="text-xs font-semibold text-muted-foreground">
                Tip 2: Click on attributes or events to copy them to your
                clipboard.
              </li>
            </ul>
            <div className="flex gap-2 items-center flex-wrap">
              {trace.vendors.map((vendor, i) => (
                <div className="flex items-center space-x-2" key={i}>
                  <Checkbox
                    id={vendor}
                    checked={selectedVendors.includes(vendor)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        if (!selectedVendors.includes(vendor))
                          setSelectedVendors([...selectedVendors, vendor]);
                      } else {
                        setSelectedVendors(
                          selectedVendors.filter((v) => v !== vendor)
                        );
                      }
                      const traces = [];
                      const currVendors = [...selectedVendors];
                      if (checked) currVendors.push(vendor);
                      else currVendors.splice(currVendors.indexOf(vendor), 1);

                      // if currVendors and trace.vendors are the same, no need to filter
                      if (currVendors.length === trace.vendors.length) {
                        setSelectedTrace(trace.trace_hierarchy);
                        return;
                      }

                      if (currVendors.length === 0) {
                        setSelectedTrace([]);
                        return;
                      }

                      for (let i = 0; i < trace.sorted_trace.length; i++) {
                        if (
                          currVendors.includes(
                            getVendorFromSpan(trace.sorted_trace[i])
                          )
                        )
                          traces.push({ ...trace.sorted_trace[i] });
                      }
                      setSelectedTrace(convertTracesToHierarchy(traces));
                    }}
                  />
                  <label
                    htmlFor={vendor}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {vendor}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-scroll">
            <TraceGraph
              spans={selectedTrace}
              totalSpans={trace.sorted_trace.length}
              totalTime={calculateTotalTime(trace.sorted_trace)}
              startTime={trace.start_time.toString()}
            />
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
