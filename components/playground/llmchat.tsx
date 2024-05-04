import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LLM_VENDOR_APIS } from "@/lib/constants";
import {
  AnthropicChatInterface,
  AnthropicSettings,
  ChatInterface,
  CohereAIRole,
  CohereChatInterface,
  CohereSettings,
  OpenAIChatInterface,
  OpenAIRole,
  OpenAISettings,
} from "@/lib/types/playground_types";
import { calculatePriceFromUsage, calculateTokens } from "@/lib/utils";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { LucideChevronRight, MinusIcon, PlusCircleIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  anthropicHandler,
  cohereHandler,
  openAIHandler,
} from "./chat-handlers";
import { Message } from "./common";
import {
  AnthropicSettingsSheet,
  CohereSettingsSheet,
  OpenAISettingsSheet,
} from "./settings-sheet";

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
  const [localLLM, setLocalLLM] = useState<ChatInterface>(llm);
  const [busy, setBusy] = useState(false);
  const { theme } = useTheme();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [cost, setCost] = useState("");
  const [latency, setLatency] = useState();

  useEffect(() => {
    const vendor = LLM_VENDOR_APIS.find(
      (vendor) => vendor.label.toLowerCase() === llm.vendor.toLowerCase()
    );
    if (typeof window === "undefined" || !vendor) return;
    const key = window.localStorage.getItem(vendor.value);
    setApiKey(key);
  }, []);

  return (
    <Card className="w-[450px] h-[600px] p-1 relative group/card">
      <div className="overflow-y-scroll h-[535px]">
        {localLLM.settings.messages.map((message, i) => (
          <Message
            vendor={localLLM.vendor}
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
              setLocalLLM({
                ...localLLM,
                settings: { ...localLLM.settings, messages: newMessages },
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
              setLocalLLM({
                ...localLLM,
                settings: { ...localLLM.settings, messages: newMessages },
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
                    role:
                      llm.vendor === "cohere"
                        ? CohereAIRole.user
                        : OpenAIRole.user,
                    content: "",
                  },
                ],
              },
            });
            setLocalLLM({
              ...localLLM,
              settings: {
                ...localLLM.settings,
                messages: [
                  ...localLLM.settings.messages,
                  {
                    id: uuidv4(),
                    role:
                      localLLM.vendor === "cohere"
                        ? CohereAIRole.user
                        : OpenAIRole.user,
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
        {llm.vendor === "openai" && (
          <OpenAISettingsSheet
            settings={llm.settings as OpenAISettings}
            setSettings={(updatedSettings: any) => {
              setLLM({ ...llm, settings: updatedSettings });
            }}
          />
        )}
        {llm.vendor === "anthropic" && (
          <AnthropicSettingsSheet
            settings={llm.settings as AnthropicSettings}
            setSettings={(updatedSettings: any) => {
              setLLM({ ...llm, settings: updatedSettings });
            }}
          />
        )}
        {llm.vendor === "cohere" && (
          <CohereSettingsSheet
            settings={llm.settings as CohereSettings}
            setSettings={(updatedSettings: any) => {
              setLLM({ ...llm, settings: updatedSettings });
            }}
          />
        )}
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
            let response: any;
            if (llm.vendor === "openai") {
              response = await openAIHandler(
                llm as OpenAIChatInterface,
                apiKey || ""
              );
            } else if (llm.vendor === "anthropic") {
              response = await anthropicHandler(
                llm as AnthropicChatInterface,
                apiKey || ""
              );
            } else if (llm.vendor === "cohere") {
              response = await cohereHandler(
                llm as CohereChatInterface,
                apiKey || ""
              );
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
                setLocalLLM({
                  ...llm,
                  settings: {
                    ...llm.settings,
                    messages: [
                      ...llm.settings.messages,
                      {
                        id: uuidv4(),
                        role:
                          llm.vendor === "cohere"
                            ? CohereAIRole.chatbot
                            : OpenAIRole.assistant,
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

              // ugly hack to check if the response is an error
              if (result.includes('{"error":"401')) {
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
                return;
              }

              setLLM({
                ...llm,
                settings: {
                  ...llm.settings,
                  messages: [
                    ...llm.settings.messages,
                    {
                      id: uuidv4(),
                      role:
                        llm.vendor === "cohere"
                          ? CohereAIRole.chatbot
                          : OpenAIRole.assistant,
                      content: result,
                    },
                  ],
                },
              });
              setLocalLLM({
                ...localLLM,
                settings: {
                  ...localLLM.settings,
                  messages: [
                    ...localLLM.settings.messages,
                    {
                      id: uuidv4(),
                      role:
                        localLLM.vendor === "cohere"
                          ? CohereAIRole.chatbot
                          : OpenAIRole.assistant,
                      content: result,
                    },
                  ],
                },
              });

              // cost calculation
              const inputContent =
                llm.settings.messages[llm.settings.messages.length - 1]
                  ?.content ?? "";
              const inputTokens = calculateTokens(inputContent);
              const outputTokens = calculateTokens(result);
              const vendor = llm.vendor;
              const model = llm.settings.model;
              const calculatedCost = calculatePriceFromUsage(vendor, model, {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
              });
              const totalCost =
                calculatedCost.total.toFixed(6) !== "0.000000"
                  ? `\$${calculatedCost.total.toFixed(6)}`
                  : "";
              setCost(totalCost);
            } else {
              const data = await response.json();
              if (data.error) {
                let message =
                  data.error ?? "An error occurred. Please try again.";
                if (data.status === 401) {
                  toast.error(
                    <div className="flex flex-col gap-2 items-start">
                      <p>
                        API key is invalid or not found. Update your API key
                      </p>
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
              let message = "";
              if (llm.vendor === "openai") {
                if (data?.choices?.length > 0) {
                  if (data.choices[0]?.message?.content) {
                    message = data.choices[0].message.content;
                  } else if (data.choices[0]?.message?.tool_calls.length > 0) {
                    message = JSON.stringify(
                      data.choices[0].message.tool_calls
                    );
                  }
                }
                if (data?.usage) {
                  const inputTokens = data.usage.prompt_tokens;
                  const outputTokens = data.usage.completion_tokens;
                  const vendor = llm.vendor;
                  const model = llm.settings.model;
                  const calculatedCost = calculatePriceFromUsage(
                    vendor,
                    model,
                    {
                      input_tokens: inputTokens,
                      output_tokens: outputTokens,
                    }
                  );
                  const totalCost =
                    calculatedCost.total.toFixed(6) !== "0.000000"
                      ? `\$${calculatedCost.total.toFixed(6)}`
                      : "";
                  setCost(totalCost);
                }
              } else if (llm.vendor === "anthropic") {
                if (data?.content?.length > 0) {
                  if (data.content[0].type === "text") {
                    message = data.content[0].text;
                  } else {
                    message = JSON.stringify(data.content[0].text);
                  }
                }
                if (data?.usage) {
                  const inputTokens = data.usage.input_tokens;
                  const outputTokens = data.usage.output_tokens;
                  const vendor = llm.vendor;
                  const model = llm.settings.model;
                  const calculatedCost = calculatePriceFromUsage(
                    vendor,
                    model,
                    {
                      input_tokens: inputTokens,
                      output_tokens: outputTokens,
                    }
                  );
                  const totalCost =
                    calculatedCost.total.toFixed(6) !== "0.000000"
                      ? `\$${calculatedCost.total.toFixed(6)}`
                      : "";
                  setCost(totalCost);
                }
              } else if (llm.vendor === "cohere") {
                if (data?.text) {
                  if (typeof data.text === "object") {
                    message = JSON.stringify(data.text);
                  } else {
                    message = data?.text;
                  }
                }
                if (data.meta?.billedUnits) {
                  const inputTokens = data.meta?.billedUnits?.inputTokens;
                  const outputTokens = data.meta?.billedUnits?.outputTokens;
                  const vendor = llm.vendor;
                  const model = llm.settings.model;
                  const calculatedCost = calculatePriceFromUsage(
                    vendor,
                    model,
                    {
                      input_tokens: inputTokens,
                      output_tokens: outputTokens,
                    }
                  );
                  const totalCost =
                    calculatedCost.total.toFixed(6) !== "0.000000"
                      ? `\$${calculatedCost.total.toFixed(6)}`
                      : "";
                  setCost(totalCost);
                }
              }
              setLLM({
                ...llm,
                settings: {
                  ...llm.settings,
                  messages: [
                    ...llm.settings.messages,
                    {
                      id: uuidv4(),
                      role:
                        llm.vendor === "cohere"
                          ? CohereAIRole.chatbot
                          : OpenAIRole.assistant,
                      content: message,
                    },
                  ],
                },
              });
              setLocalLLM({
                ...localLLM,
                settings: {
                  ...localLLM.settings,
                  messages: [
                    ...localLLM.settings.messages,
                    {
                      id: uuidv4(),
                      role:
                        localLLM.vendor === "cohere"
                          ? CohereAIRole.chatbot
                          : OpenAIRole.assistant,
                      content: message,
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
      {(cost || latency) && (
        <div className="absolute bottom-2 right-4 flex flex-col gap-2 bg-primary-foreground rounded-md p-2 w-[115px]">
          <p className="text-xs">{`Cost: ${cost}`}</p>
          <p className="text-xs break-all">{`Latency: ${latency}ms`}</p>
        </div>
      )}
    </Card>
  );
}
