import ConversationView from "@/components/shared/conversation-view";
import LanggraphView from "@/components/shared/langgraph-view";
import TraceGraph, { AttributesTabs } from "@/components/traces/trace_graph";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewAITrace } from "@/lib/crewai_trace_util";
import { Trace } from "@/lib/trace_util";
import {
  calculateTotalTime,
  convertTracesToHierarchy,
} from "@/lib/trace_utils";
import { cn, getVendorFromSpan } from "@/lib/utils";
import { CodeIcon, MessageCircle, NetworkIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function TraceComponent({ trace }: { trace: CrewAITrace }) {
  const [selectedTrace, setSelectedTrace] = useState<any[]>(
    trace.trace_hierarchy
  );
  const [selectedVendors, setSelectedVendors] = useState<string[]>(
    trace.vendors
  );
  const [includesLanggraph, setIncludesLanggraph] = useState<boolean>(false);
  const [spansView, setSpansView] = useState<
    "SPANS" | "ATTRIBUTES" | "CONVERSATION" | "LANGGRAPH"
  >("SPANS");
  const [span, setSpan] = useState<any | null>(null);
  const [attributes, setAttributes] = useState<any | null>(null);
  const [events, setEvents] = useState<any | null>(null);

  useEffect(() => {
    setSelectedTrace(trace.trace_hierarchy);
    setSelectedVendors(trace.vendors);
    if (trace.vendors.includes("langgraph")) setIncludesLanggraph(true);
    if (!open) setSpansView("SPANS");
  }, [trace, open]);

  return (
    <div className="flex md:flex-row flex-col items-stretch w-full">
      <div
        className={cn(
          "flex flex-col border border-muted rounded-md p-2",
          spansView !== "SPANS"
            ? "md:w-1/2 md:border-r-0 md:rounded-tr-none md:rounded-br-none w-full"
            : "w-full"
        )}
      >
        <p className="text-xl font-semibold mb-2">Session Drilldown</p>
        <div>
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
        </div>
      </div>
      {(spansView === "ATTRIBUTES" ||
        spansView === "CONVERSATION" ||
        spansView === "LANGGRAPH") &&
        span &&
        attributes &&
        events && (
          <div className="md:pl-2 flex flex-col gap-3 md:w-1/2 w-full md:border-l-2 md:rounded-tl-none md:rounded-bl-none border border-muted rounded-md p-2">
            <div className="flex gap-2 items-center justify-end w-full">
              <Button
                className="w-fit"
                size={"sm"}
                variant={"outline"}
                disabled={spansView === "ATTRIBUTES"}
                onClick={() => setSpansView("ATTRIBUTES")}
              >
                <CodeIcon size={16} className="mr-2" />
                Attributes
              </Button>
              <Button
                className="w-fit"
                size={"sm"}
                variant={"outline"}
                disabled={spansView === "CONVERSATION"}
                onClick={() => setSpansView("CONVERSATION")}
              >
                <MessageCircle size={16} className="mr-2 fill-primary" />
                LLM Conversations
              </Button>
              {includesLanggraph && (
                <Button
                  className="w-fit"
                  variant={"secondary"}
                  onClick={() => setSpansView("LANGGRAPH")}
                >
                  <NetworkIcon size={16} className="mr-2" />
                  Langgraph
                </Button>
              )}
              <Button
                className="w-fit"
                size={"sm"}
                variant={"destructive"}
                onClick={() => setSpansView("SPANS")}
              >
                <XIcon size={16} />
              </Button>
            </div>
            <div
              className={cn(
                spansView === "CONVERSATION"
                  ? ""
                  : "overflow-y-scroll h-[90vh]",
                "mt-12"
              )}
            >
              {spansView === "ATTRIBUTES" && (
                <AttributesTabs
                  span={span}
                  attributes={attributes}
                  events={events}
                />
              )}
              {spansView === "CONVERSATION" && span && (
                <ConversationView className="py-6 h-[85vh]" span={span} />
              )}
              {spansView === "LANGGRAPH" && (
                <LanggraphView trace={trace.sorted_trace} />
              )}
            </div>
          </div>
        )}
    </div>
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
  setSpansView: (
    spansView: "SPANS" | "ATTRIBUTES" | "CONVERSATION" | "LANGGRAPH"
  ) => void;
  setSpan: (span: any) => void;
  setAttributes: (attributes: any) => void;
  setEvents: (events: any) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 pb-3">
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
            <div className="flex items-center space-x-2 py-3" key={i}>
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
      <div className="overflow-x-scroll pb-12">
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
