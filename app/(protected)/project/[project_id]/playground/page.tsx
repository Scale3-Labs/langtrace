"use client";

import { AddLLMChat } from "@/components/playground/common";
import LLMChat from "@/components/playground/llmchat";
import {
  ChatInterface,
  OpenAIChatInterface,
  OpenAIModel,
  OpenAISettings,
} from "@/lib/types/playground_types";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Page() {
  const [llms, setLLMs] = useState<ChatInterface[]>([]);

  const handleRemove = (id: string) => {
    setLLMs((currentLLMs) => currentLLMs.filter((llm) => llm.id !== id));
  };

  const handleAdd = () => {
    const settings: OpenAISettings = {
      messages: [],
      model: "gpt-3.5-turbo" as OpenAIModel,
    };
    const openaiChat: OpenAIChatInterface = {
      id: uuidv4(),
      vendor: "openai",
      settings: settings,
    };
    setLLMs((currentLLMs) => [...currentLLMs, openaiChat]);
  };

  return (
    <div className="p-12 flex flex-row flex-wrap lg:grid lg:grid-cols-3 gap-8 w-full">
      {llms.map((llm: ChatInterface) => (
        <LLMChat
          key={llm.id}
          llm={llm}
          setLLM={(updatedLLM: ChatInterface) => {
            const newLLMs = llms.map((l) => (l.id === llm.id ? updatedLLM : l));
            setLLMs(newLLMs);
          }}
          onRemove={() => handleRemove(llm.id)}
        />
      ))}
      <AddLLMChat onAdd={handleAdd} />
    </div>
  );
}
