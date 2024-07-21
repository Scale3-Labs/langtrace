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
import { useState } from "react";

export function TraceSheet({
  trace,
  open,
  setOpen,
}: {
  trace: Trace;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [filteredSpans, setFilteredSpans] = useState(trace.sorted_trace);
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
                    onCheckedChange={(checked) => {
                      try {
                        if (checked) {
                          setFilteredSpans(
                            trace.sorted_trace.filter((span) => {
                              if (!span.attributes) return false;
                              const attributes = JSON.parse(span.attributes);
                              if (
                                Object.keys(attributes).length > 0 &&
                                "langtrace.service.name" in attributes
                              ) {
                                return (
                                  attributes[
                                    "langtrace.service.name"
                                  ].toLowerCase() === vendor
                                );
                              }
                            })
                          );
                        } else {
                          setFilteredSpans(trace.sorted_trace);
                        }
                      } catch (e) {
                        console.error(e);
                      }
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
              totalSpans={trace.sorted_trace.length}
              spans={convertTracesToHierarchy(filteredSpans)}
              totalTime={calculateTotalTime(trace.sorted_trace)}
              startTime={trace.start_time.toString()}
            />
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
