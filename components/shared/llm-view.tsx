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

          // will add once edit image wrapper has been added in sdks
          // const url = prompt?.content?.url;
          // const b64Json = prompt?.content?.b64_json;
          // const revisedPrompt = prompt?.content?.revised_prompt;
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

          const url = response?.content?.url;
          const b64Json = response?.content?.b64_json;
          const revisedPrompt = response?.content?.revised_prompt;

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
              {!url && !b64Json && (
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
              )}
              {url && (
                <div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    View Image
                  </a>
                  <img
                    src={url}
                    alt="Generated Image"
                    className="mt-2 rounded"
                  />
                  {revisedPrompt && (
                    <p className="mt-2 text-gray-700">{revisedPrompt}</p>
                  )}
                </div>
              )}
              {b64Json && (
                <div>
                  <img
                    src={`data:image/png;base64,${b64Json}`}
                    alt="Generated Image"
                    className="mt-2 rounded"
                  />
                  {revisedPrompt && (
                    <p className="mt-2 text-gray-700">{revisedPrompt}</p>
                  )}
                </div>
              )}
              {Evaluate && <Evaluate />}
            </div>
          );
        })}
    </div>
  );
};
