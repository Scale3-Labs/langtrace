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
    <div className="flex flex-col gap-6 p-4 border-[1px] border-muted rounded-lg shadow-md bg-primary-foreground">
      {prompts?.length > 0 &&
        JSON.parse(prompts).map((prompt: any, i: number) => (
          <p
            key={i}
            className="text-xs bg-muted w-fit p-1 rounded-md leading-6"
          >
            <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
              {prompt?.role ? prompt?.role?.toLowerCase() : "User"}
            </span>{" "}
            <Markdown
              className={cn(
                doPiiDetection &&
                  detectPII(prompt?.content || "").length > 0 &&
                  "underline decoration-red-600 decoration-[3px]"
              )}
            >
              {prompt?.content
                ? JSON.stringify(prompt?.content)
                : prompt?.function_call
                ? JSON.stringify(prompt?.function_call)
                : ""}
            </Markdown>
          </p>
        ))}
      {responses?.length > 0 &&
        JSON.parse(responses).map((response: any, i: number) => (
          <div
            key={i}
            className="text-xs leading-6 w-fit p-1 rounded-md bg-muted"
          >
            <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
              {response?.role?.toLowerCase() ||
                response?.message?.role ||
                "Assistant"}
              :
            </span>{" "}
            <Markdown
              className={cn(
                doPiiDetection &&
                  detectPII(
                    JSON.stringify(response?.content) ||
                      JSON.stringify(response?.message?.content) ||
                      JSON.stringify(response?.text) ||
                      ""
                  ).length > 0 &&
                  "underline decoration-red-600 decoration-[3px]"
              )}
            >
              {JSON.stringify(response?.content) ||
                JSON.stringify(response?.message?.content) ||
                JSON.stringify(response?.text) ||
                ""}
            </Markdown>
            {Evaluate && <Evaluate />}
          </div>
        ))}
    </div>
  );
};
