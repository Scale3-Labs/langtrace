import TraceGraph, { AttributesTabs } from "@/components/traces/trace_graph";
import { Button } from "@/components/ui/button";
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
import { ChevronLeft } from "lucide-react";
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
  const [spansView, setSpansView] = useState(true);
  const [span, setSpan] = useState<any | null>(null);
  const [attributes, setAttributes] = useState<any | null>(null);
  const [events, setEvents] = useState<any | null>(null);

  useEffect(() => {
    setSelectedTrace(trace.trace_hierarchy);
    setSelectedVendors(trace.vendors);
    if (!open) setSpansView(true);
  }, [trace, open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-3/4">
        <SheetHeader>
          <SheetTitle>Trace Details</SheetTitle>
          {spansView ? (
            <SpansView
              trace={trace}
              selectedTrace={selectedTrace}
              setSelectedTrace={setSelectedTrace}
              selectedVendors={selectedVendors}
              setSelectedVendors={setSelectedVendors}
              setSpansView={setSpansView}
              setSpan={setSpan}
              setAttributes={setAttributes}
              setEvents={setEvents}
            />
          ) : (
            span &&
            attributes &&
            events && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-start w-full">
                  <Button
                    className="w-fit"
                    variant={"secondary"}
                    onClick={() => setSpansView(true)}
                  >
                    <ChevronLeft size={16} className="mr-2" />
                    Back
                  </Button>
                </div>
                <div className="overflow-y-scroll h-[85vh]">
                  <AttributesTabs
                    span={span}
                    attributes={attributes}
                    events={events}
                  />
                </div>
              </div>
            )
          )}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

function SpansView({
  trace,
  selectedTrace,
  setSelectedTrace,
  selectedVendors,
  setSelectedVendors,
  setSpansView,
  setSpan,
  setAttributes,
  setEvents,
}: {
  trace: Trace;
  selectedTrace: any[];
  setSelectedTrace: (trace: any[]) => void;
  selectedVendors: string[];
  setSelectedVendors: (vendors: string[]) => void;
  setSpansView: (spansView: boolean) => void;
  setSpan: (span: any) => void;
  setAttributes: (attributes: any) => void;
  setEvents: (events: any) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          <li className="text-xs font-semibold text-muted-foreground">
            Tip 1: Hover over any span line to see additional attributes and
            events. Attributes contain the request parameters and events contain
            logs and errors.
          </li>
          <li className="text-xs font-semibold text-muted-foreground">
            Tip 2: Click on attributes or events to copy them to your clipboard.
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
          setSpansView={setSpansView}
          setSpan={setSpan}
          setAttributes={setAttributes}
          setEvents={setEvents}
        />
      </div>
    </>
  );
}
