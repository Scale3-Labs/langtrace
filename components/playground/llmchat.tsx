import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LLM_VENDORS } from "@/lib/constants";
import { ChatInterface, OpenAIRole } from "@/lib/types/playground_types";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { LucideChevronRight, MinusIcon, PlusCircleIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Message } from "./common";
import { OpenAISettingsSheet } from "./settings-sheet";

function identity<T>(value: T): T {
  return value;
}

export default function LLMChat({
  llm,
  setLLM,
  onRemove,
}: {
  llm: ChatInterface;
  setLLM: (llm: ChatInterface) => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const { theme } = useTheme();
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const vendor = LLM_VENDORS.find(
      (vendor) => vendor.label.toLowerCase() === llm.vendor.toLowerCase()
    );
    if (typeof window === "undefined" || !vendor) return;
    const key = window.localStorage.getItem(vendor.value.toUpperCase());
    setApiKey(key);
  }, []);

  return (
    <Card className="w-[450px] h-[600px] p-1 relative group/card">
      <div className="overflow-y-scroll h-[535px]">
        {llm.settings.messages.map((message, i) => (
          <Message
            key={i}
            message={{
              id: message.id,
              role: message.role,
              content: message.content,
            }}
            setMessage={(updatedMessage) => {
              const newMessages = llm.settings.messages.map((m) =>
                m.id === message.id ? updatedMessage : m
              );
              setLLM({
                ...llm,
                settings: { ...llm.settings, messages: newMessages },
              });
            }}
            onRemove={() => {
              const newMessages = llm.settings.messages.filter(
                (m) => m.id !== message.id
              );
              setLLM({
                ...llm,
                settings: { ...llm.settings, messages: newMessages },
              });
            }}
          />
        ))}
      </div>
      <div className="w-full flex items-center justify-center">
        <Button
          type="button"
          variant={llm.settings.messages.length === 0 ? "default" : "secondary"}
          className="mt-2"
          size={"lg"}
          onClick={() => {
            setLLM({
              ...llm,
              settings: {
                ...llm.settings,
                messages: [
                  ...llm.settings.messages,
                  {
                    id: uuidv4(),
                    role: OpenAIRole.user,
                    content: "",
                  },
                ],
              },
            });
          }}
        >
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          Add message
        </Button>
      </div>
      <div className="absolute -top-6 -left-3">
        <OpenAISettingsSheet
          settings={llm.settings}
          setSettings={(updatedSettings: any) => {
            setLLM({ ...llm, settings: updatedSettings });
          }}
        />
      </div>
      <Button
        type="button"
        variant={"destructive"}
        size={"icon"}
        className="h-8 w-8 hidden group-hover/card:flex items-center justify-center absolute -top-4 -right-3 rounded-full"
        onClick={onRemove}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Button
        size={"sm"}
        variant={llm.settings.messages.length === 0 ? "secondary" : "default"}
        className="absolute bottom-4 left-4"
        disabled={busy || llm.settings.messages.length === 0}
        onClick={async () => {
          setBusy(true);
          try {
            const body: any = {};
            if (llm.settings.messages.length > 0) {
              body.messages = llm.settings.messages.map((m) => {
                return { content: m.content, role: m.role };
              });
            }
            if (llm.settings.model) {
              body.model = llm.settings.model;
            }
            if (llm.settings.temperature) {
              body.temperature = llm.settings.temperature;
            }
            if (llm.settings.maxTokens) {
              body.max_tokens = llm.settings.maxTokens;
            }
            if (llm.settings.n) {
              body.n = llm.settings.n;
            }
            if (llm.settings.stop) {
              body.stop = llm.settings.stop;
            }
            if (llm.settings.frequencyPenalty) {
              body.frequency_penalty = llm.settings.frequencyPenalty;
            }
            if (llm.settings.presencePenalty) {
              body.presence_penalty = llm.settings.presencePenalty;
            }
            if (llm.settings.logProbs) {
              body.logprobs = llm.settings.logProbs;
            }
            if (llm.settings.topLogProbs) {
              body.top_logprobs = llm.settings.topLogProbs;
            }
            if (llm.settings.logitBias !== undefined) {
              body.logit_bias = llm.settings.logitBias;
            }
            if (llm.settings.responseFormat) {
              body.response_format = llm.settings.responseFormat;
            }
            if (llm.settings.seed) {
              body.seed = llm.settings.seed;
            }
            if (llm.settings.stream !== undefined) {
              body.stream = llm.settings.stream;
            }
            if (llm.settings.topP) {
              body.top_p = llm.settings.topP;
            }
            if (llm.settings.tools) {
              body.tools = llm.settings.tools;
            }
            if (llm.settings.toolChoice) {
              body.tool_choice = llm.settings.toolChoice;
            }
            if (llm.settings.user) {
              body.user = llm.settings.user;
            }

            // Get the API key from the browser store
            body.apiKey = apiKey;

            const response = await fetch("/api/chat/openai", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              let message =
                response.statusText || "An error occurred. Please try again.";
              if (response.status === 401) {
                toast.error(
                  <div className="flex flex-col gap-2 items-start">
                    <p>API key is invalid or not found. Update your API key</p>
                    <div className="w-fit">
                      <Link
                        href={"/settings/keys"}
                        className="underline text-sm font-semibold flex items-center"
                      >
                        Update API key
                        <ArrowTopRightIcon className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                );
              } else {
                toast.error(message);
              }
              return;
            }

            if (llm.settings.stream === true) {
              const reader = response?.body?.getReader();
              const decoder = new TextDecoder("utf-8");

              // Read the stream
              let receivedLength = 0;
              let chunks = [];
              let chunkTexts = [];
              while (true) {
                const { done, value } = (await reader?.read()) as {
                  done: boolean;
                  value: Uint8Array;
                };

                if (done) {
                  break;
                }

                chunks.push(value);
                receivedLength += value.length;

                // Decode chunk as text
                const chunkText = decoder.decode(value, { stream: true });
                chunkTexts.push(chunkText);
                setLLM({
                  ...llm,
                  settings: {
                    ...llm.settings,
                    messages: [
                      ...llm.settings.messages,
                      {
                        id: uuidv4(),
                        role: OpenAIRole.assistant,
                        content: chunkTexts.join(""),
                      },
                    ],
                  },
                });
              }

              // Concatenate all chunks to create a final data string
              const chunksAll = new Uint8Array(receivedLength);
              let position = 0;
              for (let chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
              }

              // Decode all chunks into text
              const result = decoder.decode(chunksAll);
              setLLM({
                ...llm,
                settings: {
                  ...llm.settings,
                  messages: [
                    ...llm.settings.messages,
                    {
                      id: uuidv4(),
                      role: OpenAIRole.assistant,
                      content: result,
                    },
                  ],
                },
              });
            } else {
              const data = await response.json();
              setLLM({
                ...llm,
                settings: {
                  ...llm.settings,
                  messages: [
                    ...llm.settings.messages,
                    {
                      id: uuidv4(),
                      role: OpenAIRole.assistant,
                      content: data.choices[0].message.content,
                    },
                  ],
                },
              });
            }
          } catch (error) {
            toast.error("An error occurred. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Submit
        {busy && (
          <Image
            src={theme === "dark" ? "/spinner-dark.svg" : "/spinner-light.svg"}
            alt="Spinner"
            width={15}
            height={15}
            className="ml-2"
          />
        )}
        {!busy && <LucideChevronRight className="ml-2 h-4 w-4" />}
      </Button>
    </Card>
  );
}
