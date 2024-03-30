import { correctTimestampFormat } from "@/lib/trace_utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { VendorLogo } from "../shared/vendor-metadata";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface Span {
  name: string;
  start_time: string;
  end_time: string;
  attributes: any;
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
  let serviceName = "";
  if (attributes["langtrace.service.name"]) {
    serviceName = attributes["langtrace.service.name"].toLowerCase();
  }

  let color = "bg-gray-500";
  if (span.name.includes("openai") || serviceName.includes("openai"))
    color = "bg-blue-500";
  else if (span.name.includes("anthropic") || serviceName.includes("anthropic"))
    color = "bg-yellow-500";
  else if (span.name.includes("pinecone") || serviceName.includes("pinecone"))
    color = "bg-green-500";
  else if (span.name.includes("chromadb") || serviceName.includes("chromadb"))
    color = "bg-indigo-500";
  else if (span.name.includes("langchain") || serviceName.includes("langchain"))
    color = "bg-purple-500";
  else if (
    span.name.includes("llamaindex") ||
    serviceName.includes("llamaindex")
  )
    color = "bg-indigo-500";

  return (
    <div className="flex flex-col gap-3 w-full mt-2">
      <div className="flex items-center">
        <div
          className="flex gap-2 items-center"
          style={{ marginLeft: `${level * 10}px` }}
        >
          {span.children && span.children.length > 0 && (
            <Button onClick={toggleCollapse} variant={"ghost"} size={"icon"}>
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
          <VendorLogo span={span} />
          <span className="text-xs">{span.name}</span>
        </div>
        <div
          className={`h-4 rounded-sm ${color} absolute ml-[508px] flex items-center justify-center`}
          style={{ left: `${startX}px`, width: `${spanLength}px` }}
        >
          <span className="text-xs text-white font-semibold">
            {/* duration */}
            {(
              new Date(correctTimestampFormat(span.end_time)).getTime() -
              new Date(correctTimestampFormat(span.start_time)).getTime()
            ).toFixed(2)}
            ms
          </span>
        </div>
      </div>
      {!isCollapsed &&
        span.children &&
        span.children.map((childSpan) => (
          <SpanItem
            key={childSpan.name}
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

  const spanBars = spans.map((span) => (
    <SpanItem
      key={span.name}
      span={span}
      level={0}
      totalTime={totalTime}
      startTime={startTime}
    />
  ));

  return (
    <div className="relative flex flex-col">
      <div className="absolute top-3 left-3 flex flex-col">
        <p className="text-sm font-semibold text-muted-foreground">
          Span Graph
        </p>
        <p className="text-xs text-muted-foreground">{totalSpans} span(s)</p>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-[166px] h-[95%] absolute ml-[500px] -z-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1 items-center">
            <p className="text-muted-foreground text-xs">
              {(step * i).toFixed(2)}ms
            </p>
            <Separator orientation="vertical" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 mt-12">{spanBars}</div>
    </div>
  );
};

function calculateSpanStartAndEnd(
  startTime: string,
  endTime: string,
  totalTraceTime: number,
  spanStartTime: string
) {
  const scaleWidth = 920; // This is the total width of the scale in pixels (5 steps * 166px/step) + 15*6px for the separators

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
