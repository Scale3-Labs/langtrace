import { AddtoDataset } from "@/components/shared/add-to-dataset";
import ConversationView from "@/components/shared/conversation-view";
import LanggraphView from "@/components/shared/langgraph-view";
import TraceGraph, { AttributesTabs } from "@/components/traces/trace_graph";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trace } from "@/lib/trace_util";
import {
  calculateTotalTime,
  convertTracesToHierarchy,
  correctTimestampFormat,
} from "@/lib/trace_utils";
import { formatDateTime, getVendorFromSpan } from "@/lib/utils";
import {
  ChevronLeft,
  CodeIcon,
  MessageCircle,
  NetworkIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EvaluateSession } from "./evaluate-session";

interface CheckedData {
  input: string;
  output: string;
  spanId: string;
}

export function TraceSheet({
  project_id,
  trace,
  open,
  setOpen,
}: {
  project_id: string;
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
  const [includesLanggraph, setIncludesLanggraph] = useState<boolean>(false);
  const [spansView, setSpansView] = useState<
    "SPANS" | "ATTRIBUTES" | "CONVERSATION" | "LANGGRAPH"
  >("SPANS");
  const [span, setSpan] = useState<any | null>(null);
  const [spanDate, setSpanDate] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<any | null>(null);
  const [events, setEvents] = useState<any | null>(null);
  const [selectedData, setSelectedData] = useState<CheckedData | null>(null);

  useEffect(() => {
    setSelectedTrace(trace.trace_hierarchy);
    setSelectedVendors(trace.vendors);
    if (trace.vendors.includes("langgraph")) setIncludesLanggraph(true);
    if (!open) {
      setSelectedData(null);
      setSpansView("SPANS");
    }
  }, [trace, open]);

  useEffect(() => {
    if (span) {
      const spanId = span.span_id;
      const attributes = span?.attributes ? JSON.parse(span.attributes) : {};

      let prompt: string = "";
      let response: string = "";
      if (span.events) {
        const events: any[] = JSON.parse(span.events);

        const promptEvent = events.find(
          (event: any) => event.name === "gen_ai.content.prompt"
        );
        if (
          promptEvent &&
          promptEvent["attributes"] &&
          promptEvent["attributes"]["gen_ai.prompt"]
        ) {
          prompt = promptEvent["attributes"]["gen_ai.prompt"];
        }

        const responseEvent = events.find(
          (event: any) => event.name === "gen_ai.content.completion"
        );
        if (
          responseEvent &&
          responseEvent["attributes"] &&
          responseEvent["attributes"]["gen_ai.completion"]
        ) {
          response = responseEvent["attributes"]["gen_ai.completion"];
        }
      }
      if (attributes["llm.prompts"] && attributes["llm.responses"]) {
        prompt = attributes["llm.prompts"];
        response = attributes["llm.responses"];
      }

      if (attributes["langtrace.service.type"]) {
        setType(attributes["langtrace.service.type"]);
      } else {
        setType(null);
      }

      if (span.start_time) {
        setSpanDate(
          formatDateTime(correctTimestampFormat(span.start_time), true)
        );
      } else {
        setSpanDate(null);
      }

      const inputData = prompt ? JSON.parse(prompt) : [];
      const outputData = response ? JSON.parse(response) : [];

      const input = inputData.length > 0 ? inputData[0].content : "";
      const output = outputData.length > 0 ? outputData[0].content : "";

      if (input && output) {
        const checkedData = {
          spanId,
          input,
          output,
        };
        setSelectedData(checkedData);
      } else {
        setSelectedData(null);
      }
    } else {
      setSelectedData(null);
      setType(null);
      setEvents(null);
      setAttributes(null);
      setSpansView("SPANS");
      setSpan(null);
      setSpanDate(null);
    }
  }, [span]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetDescription hidden>Trace Debugger</SheetDescription>
      <SheetContent className="w-3/4 z-40">
        <SheetHeader>
          <SheetTitle>Trace Details</SheetTitle>
          {spansView === "SPANS" && (
            <SpansView
              project_id={project_id}
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
          )}
          {(spansView === "ATTRIBUTES" ||
            spansView === "CONVERSATION" ||
            spansView === "LANGGRAPH") &&
            span &&
            attributes &&
            events && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center justify-between w-full flex-wrap">
                  <Button
                    className="w-fit"
                    size={"sm"}
                    variant={"outline"}
                    onClick={() => setSpansView("SPANS")}
                  >
                    <ChevronLeft size={16} className="mr-2" />
                    Back
                  </Button>
                  <div className="flex gap-2 items-center flex-wrap">
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
                    <AddtoDataset
                      projectId={project_id}
                      selectedData={selectedData ? [selectedData] : []}
                      disabled={
                        selectedData === null ||
                        (selectedData.input === "" &&
                          selectedData.output === "")
                      }
                    />
                    <EvaluateSession
                      span={span}
                      projectId={project_id}
                      sessionName={span.name}
                      type={type}
                    />
                  </div>
                </div>
                <div
                  className={
                    spansView === "CONVERSATION"
                      ? ""
                      : "overflow-y-scroll h-[85vh]"
                  }
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
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

function SpansView({
  project_id,
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
  project_id: string;
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
        <div className="flex justify-between items-center">
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
          <EvaluateSession
            span={selectedTrace[0]}
            projectId={project_id}
            sessionName="Session"
            type="session"
          />
        </div>
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
