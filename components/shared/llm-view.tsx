"use client";

import detectPII from "@/lib/pii";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";

export const LLMView = ({
  prompts,
  responses,
  Evaluate = () => null,
  doPiiDetection = false,
}: {
  prompts: any;
  responses: any;
  Evaluate?: React.FC;
  doPiiDetection?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-6 p-4 border-[1px] border-muted-foreground rounded-md">
      {prompts?.length > 0 &&
        JSON.parse(prompts).map((prompt: any, i: number) => (
          <p
            key={i}
            className="text-xs bg-muted w-fit p-1 rounded-md leading-6"
          >
            <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
              {prompt?.role
                ? prompt?.role === "function"
                  ? `${prompt?.role} - ${prompt?.name}`
                  : prompt?.role
                : "Q"}
              :
              {prompt?.content
                ? " (content)"
                : prompt?.function_call
                ? " (function call)"
                : ""}
            </span>{" "}
            <Markdown
              className={cn(
                doPiiDetection &&
                  detectPII(prompt?.content || "").length > 0 &&
                  "underline decoration-red-600 decoration-[3px]"
              )}
            >
              {prompt?.content
                ? prompt?.content
                : prompt?.function_call
                ? JSON.stringify(prompt?.function_call)
                : ""}
            </Markdown>
          </p>
        ))}
      <div className="text-xs leading-6 w-fit p-1 rounded-md bg-muted">
        <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
          {JSON.parse(responses)[0]?.message?.role || "Assistant"}:
        </span>{" "}
        {responses?.length > 0 ? (
          <Markdown
            className={cn(
              doPiiDetection &&
                detectPII(
                  JSON.parse(responses)[0]?.message?.content ||
                    JSON.parse(responses)[0]?.text ||
                    JSON.parse(responses)[0]?.content ||
                    ""
                ).length > 0 &&
                "underline decoration-red-600 decoration-[3px]"
            )}
          >
            {JSON.parse(responses)[0]?.message?.content ||
              JSON.parse(responses)[0]?.text ||
              JSON.parse(responses)[0]?.content ||
              JSON.parse(responses).message?.content}
          </Markdown>
        ) : (
          ""
        )}
        {Evaluate && <Evaluate />}
      </div>
    </div>
  );
};
