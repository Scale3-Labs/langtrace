import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LLMVendor, OpenAIRole } from "@/lib/types/playground_types";
import { LucideChevronRight, MinusIcon, PlusCircleIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Message } from "./common";
import { OpenAISettingsSheet } from "./settings-sheet";

export default function LLMChat({
  llm,
  setLLM,
  onRemove,
}: {
  llm: LLMVendor;
  setLLM: (llm: LLMVendor) => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const { theme } = useTheme();
  return (
    <Card className="w-[450px] h-[600px] p-1 relative group/card">
      <div className="overflow-y-scroll h-[535px]">
        {llm.messages.map((message, i) => (
          <Message
            key={i}
            message={{
              id: message.id,
              role: message.role,
              content: message.content,
            }}
            setMessage={(updatedMessage) => {
              const newMessages = llm.messages.map((m) =>
                m.id === message.id ? updatedMessage : m
              );
              setLLM({ ...llm, messages: newMessages });
            }}
            onRemove={() => {
              const newMessages = llm.messages.filter(
                (m) => m.id !== message.id
              );
              setLLM({ ...llm, messages: newMessages });
            }}
          />
        ))}
      </div>
      <div className="w-full flex items-center justify-center">
        <Button
          type="button"
          variant={llm.messages.length === 0 ? "default" : "secondary"}
          className="mt-2"
          size={"lg"}
          onClick={() => {
            setLLM({
              ...llm,
              messages: [
                ...llm.messages,
                {
                  id: uuidv4(),
                  role: OpenAIRole.user,
                  content: "",
                },
              ],
            });
          }}
        >
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          Add message
        </Button>
      </div>
      <div className="absolute -top-6 -left-3">
        <OpenAISettingsSheet />
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
        variant={llm.messages.length === 0 ? "secondary" : "default"}
        className="absolute bottom-4 left-4"
        disabled={busy || llm.messages.length === 0}
        onClick={async () => {
          setBusy(true);
          try {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: llm.messages.map((m) => {
                  return { content: m.content, role: m.role };
                }),
              }),
            });
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
                messages: [
                  ...llm.messages,
                  {
                    id: uuidv4(),
                    role: OpenAIRole.assistant,
                    content: chunkTexts.join(""),
                  },
                ],
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
              messages: [
                ...llm.messages,
                {
                  id: uuidv4(),
                  role: OpenAIRole.assistant,
                  content: result,
                },
              ],
            });
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
