"use client";

import detectPII from "@/lib/pii";
import { cn, safeStringify } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../ui/button";

export const LLMView = ({
  prompts = [],
  responses = [],
  setMessages,
  Evaluate = () => null,
  doPiiDetection = false,
  importTrace = false,
}: {
  prompts?: any;
  responses?: any;
  setMessages?: (messages: any[]) => void;
  Evaluate?: React.FC;
  doPiiDetection?: boolean;
  importTrace?: boolean;
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const hasPrompts = prompts.length > 0;
  const hasResponses = responses.length > 0;

  return (
    <div className="flex flex-col gap-6 p-4 border-[1px] border-muted rounded-lg shadow-md bg-primary-foreground">
      <div className="flex flex-wrap items-center gap-2">
        {(hasPrompts ? prompts : responses).map((_: any, i: number) => (
          <Button
            key={i}
            size={"sm"}
            variant={selectedTab === i ? "secondary" : "outline"}
            onClick={() => setSelectedTab(i)}
          >
            {hasPrompts ? `Request ${i + 1}` : `Response ${i + 1}`}
          </Button>
        ))}
        {importTrace && (hasPrompts || hasResponses) && (
          <Button
            size={"sm"}
            onClick={() => {
              if (!setMessages) return;
              const messages: any[] = [];

              if (hasPrompts) {
                JSON.parse(prompts[selectedTab]).forEach((prompt: any) => {
                  const role = prompt?.role
                    ? prompt?.role?.toLowerCase()
                    : "user";
                  const content = prompt?.content
                    ? prompt?.content
                    : prompt?.function_call
                      ? prompt?.function_call
                      : "";
                  messages.push({ role: role, content: content, id: uuidv4() });
                });
              }

              if (hasResponses) {
                JSON.parse(responses[selectedTab]).forEach((response: any) => {
                  const role = response?.role?.toLowerCase() || "assistant";
                  const content =
                    response?.content ||
                    response?.message?.content ||
                    response?.text ||
                    "";
                  messages.push({ role: role, content: content, id: uuidv4() });
                });
              }

              setMessages(messages);
            }}
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            Import Conversation
          </Button>
        )}
      </div>

      {/* Render Prompts */}
      {hasPrompts &&
        typeof JSON.parse(prompts[selectedTab]) === "object" &&
        JSON.parse(prompts[selectedTab]).map((prompt: any, i: number) => {
          let role;
          let content;
          if (Array.isArray(prompt) && prompt.length > 0) {
            role = prompt[0]?.role ? prompt[0]?.role?.toLowerCase() : "User";
            content = prompt[0]?.content
              ? prompt[0]?.content
              : prompt[0]?.function_call
                ? prompt[0]?.function_call
                : "";
          } else {
            role = prompt?.role ? prompt?.role?.toLowerCase() : "User";
            content = prompt?.content
              ? prompt?.content
              : prompt?.function_call
                ? prompt?.function_call
                : "";
          }

          return (
            <div
              key={i}
              className="text-xs bg-muted w-fit p-1 rounded-md leading-6"
            >
              <span className="font-semibold dark:text-red-400 text-red-600 capitalize">
                <div className="flex justify-between">{role}</div>
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

      {/* Render Responses */}
      {hasResponses &&
        typeof JSON.parse(responses[selectedTab]) === "object" &&
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
                <div className="flex justify-between">{role}</div>
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
