"use client";
"use client";

import { correctTimestampFormat } from "@/lib/trace_utils";
import { cn, formatDateTime, parseNestedJsonFields } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { JsonView, allExpanded, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import {
  serviceTypeColor,
  vendorBadgeColor,
} from "../../shared/vendor-metadata";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";

export const LogsView = ({
  span,
  utcTime,
}: {
  span: any;
  utcTime: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const servTypeColor = serviceTypeColor(
    JSON.parse(span.attributes)["langtrace.service.type"]
  );

  const servColor = vendorBadgeColor(
    JSON.parse(span.attributes)["langtrace.service.name"]?.toLowerCase()
  );
  return (
    <div className="flex flex-col">
      <div
        className="flex flex-row items-center gap-3 cursor-pointer hover:bg-muted rounded-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed && (
            <ChevronRight className="text-muted-foreground w-5 h-5" />
          )}
          {!collapsed && (
            <ChevronDown className="text-muted-foreground w-5 h-5" />
          )}
        </Button>
        <p className="text-xs font-semibold">
          {formatDateTime(correctTimestampFormat(span.start_time), !utcTime)}
        </p>
        <p className="text-xs bg-muted p-1 rounded-md font-semibold">
          {span.name}
        </p>
        {JSON.parse(span.attributes)["langtrace.service.type"] && (
          <p
            className={cn(
              "text-xs font-semibold text-white bg-muted p-1 rounded-md",
              servTypeColor
            )}
          >
            {JSON.parse(span.attributes)["langtrace.service.type"]}
          </p>
        )}
        {JSON.parse(span.attributes)["langtrace.service.name"] && (
          <p
            className={cn(
              "text-xs bg-muted p-1 rounded-md text-white font-semibold",
              servColor
            )}
          >
            {JSON.parse(span.attributes)["langtrace.service.name"]}
          </p>
        )}
        {JSON.parse(span.attributes)["langtrace.service.version"] && (
          <p className="text-xs bg-muted-foreground p-1 rounded-md text-white font-semibold">
            {JSON.parse(span.attributes)["langtrace.service.version"]}
          </p>
        )}
        {JSON.parse(span.attributes)["langtrace.service.type"] === "llm" && (
          <p
            className={cn(
              "text-xs font-semibold text-white bg-muted p-1 rounded-md",
              servTypeColor
            )}
          >
            {JSON.parse(span.attributes)["llm.model"]}
          </p>
        )}
      </div>
      {!collapsed && (
        <JsonView
          data={JSON.parse(parseNestedJsonFields(span.attributes))}
          shouldExpandNode={allExpanded}
          style={defaultStyles}
        />
      )}
      <Separator />
    </div>
  );
};
