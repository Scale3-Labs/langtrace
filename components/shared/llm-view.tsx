"use client";

import detectPII from "@/lib/pii";
import { cn, safeStringify } from "@/lib/utils";
import { useState } from "react";
import { Button } from "../ui/button";

export const LLMView = ({
  prompts,
  responses,
  Evaluate = () => null,
  doPiiDetection = false,
  importTrace = false,
  setSelectedPrompt,
}: {
  prompts: any;
  responses: any;
  Evaluate?: React.FC;
  doPiiDetection?: boolean;
  importTrace?: boolean;
  setSelectedPrompt?: (prompt: string) => void;
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <div className="flex flex-col gap-6 p-4 border-[1px] border-muted rounded-lg shadow-md bg-primary-foreground">
      <div className="flex items-center gap-2">
        {prompts.map((prompt: any, i: number) => (
          <Button
            key={i}
            size={"sm"}
            variant={selectedTab === i ? "secondary" : "outline"}
            onClick={() => setSelectedTab(i)}
          >
            Request {i + 1}
          </Button>
        ))}
      </div>
      {prompts?.length > 0 &&
        JSON.parse(prompts[selectedTab]).map((prompt: any, i: number) => {
          const role = prompt?.role ? prompt?.role?.toLowerCase() : "User";
          const content = prompt?.content
            ? prompt?.content
            : prompt?.function_call
            ? prompt?.function_call
            : "";
          return (
            <div
              key={i}
              className="text-xs bg-muted w-fit p-1 rounded-md leading-6"
            >
              <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
                <div className="flex justify-between">
                  {role}
                  {importTrace ? (
                    <Button
                      size={"xs"}
                      className="text-xs font-medium px-2"
                      onClick={() => {
                        setSelectedPrompt!(content);
                      }}
                    >
                      Import
                    </Button>
                  ) : (
                    <></>
                  )}
                </div>
              </span>{" "}
              <div
                className={cn(
                  doPiiDetection &&
                    typeof content === "string" &&
                    content !== "" &&
                    detectPII(content).length > 0 &&
                    "underline decoration-red-600 decoration-[3px]"
                )}
                dangerouslySetInnerHTML={{ __html: safeStringify(content) }}
              />
            </div>
          );
        })}
      {responses?.length > 0 &&
        JSON.parse(responses[selectedTab]).map((response: any, i: number) => {
          const role =
            response?.role?.toLowerCase() ||
            response?.message?.role ||
            "Assistant";
          const content =
            response?.content ||
            response?.message?.content ||
            response?.text ||
            "";

          return (
            <div
              key={i}
              className="text-xs leading-6 w-fit p-1 rounded-md bg-muted"
            >
              <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
                <div className="flex justify-between">
                  {role}
                  {importTrace ? (
                    <Button
                      size={"xs"}
                      className="text-xs font-medium px-2"
                      onClick={() => {
                        setSelectedPrompt!(content);
                      }}
                    >
                      Import
                    </Button>
                  ) : (
                    <></>
                  )}
                </div>
              </span>
              <div
                className={cn(
                  doPiiDetection &&
                    typeof content === "string" &&
                    content !== "" &&
                    detectPII(content).length > 0 &&
                    "underline decoration-red-600 decoration-[3px]"
                )}
                dangerouslySetInnerHTML={{ __html: safeStringify(content) }}
              />
              {Evaluate && <Evaluate />}
            </div>
          );
        })}
    </div>
  );
};
