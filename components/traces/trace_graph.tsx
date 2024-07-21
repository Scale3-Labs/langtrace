import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jsontheme } from "@/lib/constants";
import { correctTimestampFormat } from "@/lib/trace_utils";
import { cn, getVendorFromSpan } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useState } from "react";
import { JSONTree } from "react-json-tree";
import { toast } from "sonner";
import { VendorLogo } from "../shared/vendor-metadata";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Separator } from "../ui/separator";

interface Span {
  name: string;
  start_time: string;
  end_time: string;
  attributes: any;
  events: any;
  status_code: string;
  children?: Span[];
}

interface TraceGraphProps {
  spans: Span[];
  totalTime: number;
  startTime: string;
  totalSpans: number;
}

interface SpanItemProps {
  span: Span;
  level: number;
  totalTime: number;
  startTime: string;
}

const SpanItem: React.FC<SpanItemProps> = ({
  span,
  level,
  totalTime,
  startTime,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const { startX, endX } = calculateSpanStartAndEnd(
    span.start_time,
    span.end_time,
    totalTime,
    startTime
  );
  const spanLength = endX - startX === 0 ? 10 : endX - startX;

  const attributes = span.attributes ? JSON.parse(span.attributes) : {};
  const events =
    span.events && span.events !== "[]" ? JSON.parse(span.events) : [];
  let serviceName = "";
  if (attributes["langtrace.service.name"]) {
    serviceName = attributes["langtrace.service.name"].toLowerCase();
  }

  let color = "bg-gray-500";
  if (span.name.includes("perplexity") || serviceName.includes("perplexity"))
    color = "bg-slate-500";
  else if (span.name.includes("openai") || serviceName.includes("openai"))
    color = "bg-blue-500";
  else if (span.name.includes("anthropic") || serviceName.includes("anthropic"))
    color = "bg-yellow-500";
  else if (span.name.includes("pinecone") || serviceName.includes("pinecone"))
    color = "bg-green-500";
  else if (span.name.includes("chromadb") || serviceName.includes("chromadb"))
    color = "bg-indigo-500";
  else if (span.name.includes("langchain") || serviceName.includes("langchain"))
    color = "bg-purple-500";
  else if (span.name.includes("cohere") || serviceName.includes("cohere"))
    color = "bg-red-500";
  else if (span.name.includes("qdrant") || serviceName.includes("qdrant"))
    color = "bg-grey-500";
  else if (span.name.includes("groq") || serviceName.includes("groq"))
    color = "bg-slate-500";
  else if (span.name.includes("dspy") || serviceName.includes("dspy"))
    color = "bg-red-500";
  else if (span.name.includes("crewai") || serviceName.includes("crewai"))
    color = "bg-red-500";
  else if (span.name.includes("weaviate") || serviceName.includes("weaviate"))
    color = "bg-green-500";
  else if (span.name.includes("pg") || serviceName.includes("pg"))
    color = "bg-blue-500";
  else if (span.name.includes("gemini") || serviceName.includes("gemini"))
    color = "bg-blue-500";
  else if (span.name.includes("vertex") || serviceName.includes("vertex"))
    color = "bg-blue-500";
  else if (
    span.name.includes("llamaindex") ||
    serviceName.includes("llamaindex")
  )
    color = "bg-indigo-500";

  const vendor = getVendorFromSpan(span as any);

  return (
    <div className="flex flex-col gap-1 w-full mt-2">
      <div className="flex items-center">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div
              className="z-0 flex gap-2 items-center sticky left-4 bg-primary-foreground rounded-md pr-2"
              style={{ marginLeft: `${level * 10}px` }}
            >
              {span.children && span.children.length > 0 && (
                <Button
                  onClick={toggleCollapse}
                  variant={"ghost"}
                  size={"icon"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              )}
              {!span.children ||
                (span.children.length === 0 && (
                  <div className="border-b-2 border-l-2 border-muted-foreground rounded-bl-md w-3 h-3 ml-2 mb-2" />
                ))}
              <VendorLogo vendor={vendor} />
              <span className="text-xs max-w-72">{span.name}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  span.status_code === "ERROR"
                    ? "bg-destructive animate-pulse"
                    : "bg-teal-400"
                }`}
              ></span>
            </div>
          </HoverCardTrigger>
          <SpanHoverContent
            span={span}
            attributes={attributes}
            events={events}
          />
        </HoverCard>
        <HoverCard>
          <HoverCardTrigger asChild>
            <div
              className={cn(
                "h-4 rounded-sm absolute ml-[500px] flex items-center justify-center",
                span.status_code === "ERROR" ? "bg-destructive" : color
              )}
              style={{ left: `${startX}px`, width: `${spanLength}px` }}
            >
              <span className="text-xs text-primary-foreground font-semibold">
                {/* duration */}
                {(
                  new Date(correctTimestampFormat(span.end_time)).getTime() -
                  new Date(correctTimestampFormat(span.start_time)).getTime()
                ).toFixed(2)}
                ms
              </span>
            </div>
          </HoverCardTrigger>
          <SpanHoverContent
            span={span}
            attributes={attributes}
            events={events}
          />
        </HoverCard>
      </div>
      {!isCollapsed &&
        span.children &&
        span.children.map((childSpan, i) => (
          <SpanItem
            key={i}
            span={childSpan}
            level={level + 1}
            totalTime={totalTime}
            startTime={startTime}
          />
        ))}
    </div>
  );
};

export const TraceGraph: React.FC<TraceGraphProps> = ({
  spans,
  totalTime,
  startTime,
  totalSpans,
}) => {
  // Divide the totalTime into 6 parts
  const step = totalTime / 5;

  const SpanBars = () =>
    spans.map((span) => (
      <SpanItem
        key={span.name}
        span={span}
        level={0}
        totalTime={totalTime}
        startTime={startTime}
      />
    ));

  return (
    <div className="relative flex flex-col h-screen overflow-y-scroll">
      <div className="absolute top-3 left-3 flex flex-col">
        <p className="text-sm font-semibold text-muted-foreground">
          Span Graph
        </p>
        <p className="text-xs text-muted-foreground">{totalSpans} span(s)</p>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-[166px] h-[100%] absolute ml-[500px] -z-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1 items-center">
            <p className="text-muted-foreground text-xs">
              {(step * i).toFixed(2)}ms
            </p>
            <Separator orientation="vertical" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 mt-12">
        <SpanBars />
      </div>
    </div>
  );
};

function calculateSpanStartAndEnd(
  startTime: string,
  endTime: string,
  totalTraceTime: number,
  spanStartTime: string
) {
  const scaleWidth = 166 * 5; // This is the total width of the scale in pixels (5 steps * 166px/step) + 15*6px for the separators

  // Function to convert time to pixels
  const timeToPixels = (time: number) => (time / totalTraceTime) * scaleWidth;

  // Assuming you have a reference time which is the start time of your scale
  const referenceTime = new Date(
    correctTimestampFormat(spanStartTime)
  ).getTime();

  const spanStartTimeD = new Date(correctTimestampFormat(startTime)).getTime();
  const spanEndTimeD = new Date(correctTimestampFormat(endTime)).getTime();

  // Convert the span's start and end times to a time duration relative to the reference time
  const startDuration = spanStartTimeD - referenceTime;
  const endDuration = spanEndTimeD - referenceTime;

  // Now convert the time duration to pixel positions
  return {
    startX: timeToPixels(startDuration),
    endX: timeToPixels(endDuration),
  };
}

export default TraceGraph;

function SpanHoverContent({
  span,
  attributes,
  events,
}: {
  span: any;
  attributes: any;
  events: any;
}) {
  const { theme } = useTheme();
  return (
    <HoverCardContent className="w-[30rem] h-[30rem] max-h-[30rem] p-4 overflow-y-scroll whitespace-pre-wrap text-sm z-50">
      <Tabs
        defaultValue={span.status_code === "ERROR" ? "events" : "attributes"}
      >
        <TabsList className="grid w-full grid-cols-2 sticky top-0 z-50">
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="events">
            {span.status_code === "ERROR" ? "Errors" : "Events"}
          </TabsTrigger>
        </TabsList>
        <p className="text-xs font-semibold my-3 text-blue-500">
          Tip: Click any content to copy to clipboard
        </p>
        <TabsContent value="attributes">
          {Object.keys(attributes).length > 0 ? (
            Object.keys(attributes).map((key, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="grid grid-cols-2 mt-2 items-start">
                  <p className="font-semibold text-xs rounded-md p-1 bg-muted w-fit">
                    {key}
                  </p>
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(attributes[key].toString());
                      toast.success("Copied to clipboard");
                    }}
                    className="text-xs select-all"
                    dangerouslySetInnerHTML={{
                      __html: attributes[key].toString(),
                    }}
                  />
                </div>
                <Separator />
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              No attributes found.
            </p>
          )}
        </TabsContent>
        <TabsContent
          value="events"
          onClick={() => {
            if (events && events.length > 0) {
              navigator.clipboard.writeText(JSON.stringify(events));
              toast.success("Copied to clipboard");
            }
          }}
        >
          {events.length > 0 ? (
            events.map((event: any, key: number) => (
              <JSONTree
                shouldExpandNodeInitially={() => true}
                key={key}
                data={event}
                theme={jsontheme}
                invertTheme={theme === "light"}
                labelRenderer={([key]) => <strong>{key}</strong>}
                valueRenderer={(raw: any) => (
                  <span className="overflow-x-hidden">{raw}</span>
                )}
                postprocessValue={(raw: any) => {
                  if (typeof raw === "string") {
                    try {
                      return JSON.parse(raw);
                    } catch (e) {
                      return raw;
                    }
                  }
                  return raw;
                }}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No events found.</p>
          )}
        </TabsContent>
      </Tabs>
    </HoverCardContent>
  );
}
