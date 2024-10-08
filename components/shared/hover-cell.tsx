import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn, safeStringify } from "@/lib/utils";
import { ClipboardIcon, MoveDiagonal, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function HoverCell({
  values,
  className,
  expand = false,
}: {
  values: any[];
  className?: string;
  expand?: boolean;
}) {
  try {
    const [expandedView, setExpandedView] = useState(expand);
    if (!values || !Array.isArray(values)) {
      return null;
    }
    const contents = values.map((value, i) => {
      const role = value?.role
        ? value?.role?.toLowerCase()
        : value?.message?.role
          ? value?.message?.role
          : "User";
      const content = value?.content
        ? safeStringify(value?.content)
        : value?.function_call
          ? safeStringify(value?.function_call)
          : value?.message?.content
            ? safeStringify(value?.message?.content)
            : value?.text
              ? safeStringify(value?.text)
              : "";
      return { role, content };
    });

    if (!contents || contents.length === 0) {
      return null;
    }

    const copyToClipboard = (e: any) => {
      e.stopPropagation();
      const content = values
        .map((item) => `${item.role}: ${JSON.stringify(item.content)}`)
        .join("\n");
      navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    };

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="relative">
            <ClipboardIcon
              className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-1 right-1"
              onClick={copyToClipboard}
            />
            {!expandedView && (
              <MoveDiagonal
                className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-1 right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedView(!expandedView);
                }}
              />
            )}
            {expandedView && (
              <X
                className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-1 right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedView(!expandedView);
                }}
              />
            )}
            <div
              className={cn(
                className,
                "overflow-y-scroll whitespace-pre-wrap px-[6px] pb-[6px] pt-5 text-sm bg-muted rounded-md",
                expandedView ? "" : "max-h-14"
              )}
              dangerouslySetInnerHTML={{
                __html:
                  contents[contents.length - 1].content === ""
                    ? "No data available"
                    : contents[contents.length - 1].content,
              }}
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          className="w-[40rem] max-h-[20rem] p-4 overflow-y-scroll whitespace-pre-wrap text-sm cursor-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <ClipboardIcon
              className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-0 right-0"
              onClick={copyToClipboard}
            />
            <div className="flex flex-col gap-4">
              {contents.map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <p className="font-semibold capitalize text-xs rounded-md p-1 bg-muted w-fit">
                    {item.role === "" ? "No role" : item.role}
                  </p>
                  <div
                    className="break-all text-xs"
                    dangerouslySetInnerHTML={{
                      __html:
                        item.content === ""
                          ? "No data available"
                          : item.content,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  } catch (e) {
    return null;
  }
}

export function GenericHoverCell({
  value,
  className,
  expand = false,
}: {
  value: any;
  className?: string;
  expand?: boolean;
}) {
  try {
    const [expandedView, setExpandedView] = useState(expand);
    const content = safeStringify(value);

    if (!content || content.length === 0) {
      return null;
    }

    const copyToClipboard = (e: any) => {
      e.stopPropagation();
      navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    };

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="relative">
            <ClipboardIcon
              className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-1 right-1"
              onClick={copyToClipboard}
            />
            {!expandedView && (
              <MoveDiagonal
                className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-1 right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedView(!expandedView);
                }}
              />
            )}
            {expandedView && (
              <X
                className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-1 right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedView(!expandedView);
                }}
              />
            )}
            <div
              className={cn(
                className,
                "overflow-y-scroll whitespace-pre-wrap px-[6px] pb-[6px] pt-5 text-sm bg-muted rounded-md",
                expandedView ? "" : "max-h-14"
              )}
              dangerouslySetInnerHTML={{
                __html: content === "" ? "No data available" : content,
              }}
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          className="w-[40rem] max-h-[20rem] p-4 overflow-y-scroll whitespace-pre-wrap text-sm cursor-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <ClipboardIcon
              className="h-4 w-4 hover:bg-primary-foreground hover:text-primary cursor-pointer text-muted-foreground absolute top-0 right-0"
              onClick={copyToClipboard}
            />
            <div
              className="break-all text-xs"
              dangerouslySetInnerHTML={{
                __html: content === "" ? "No data available" : content,
              }}
            />
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  } catch (e) {
    return null;
  }
}
