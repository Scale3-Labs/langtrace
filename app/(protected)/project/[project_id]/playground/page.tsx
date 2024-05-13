"use client";

import { AddLLMChat } from "@/components/playground/common";
import LLMChat from "@/components/playground/llmchat";
import {
  AnthropicModel,
  AnthropicSettings,
  ChatInterface,
  CohereSettings,
  GroqSettings,
  OpenAIChatInterface,
  OpenAIModel,
  OpenAISettings,
  PerplexitySettings,
} from "@/lib/types/playground_types";
import Link from "next/link";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Page() {
  const [llms, setLLMs] = useState<ChatInterface[]>([]);

  const handleRemove = (id: string) => {
    setLLMs((currentLLMs) => currentLLMs.filter((llm) => llm.id !== id));
  };

  const handleAdd = (vendor: string) => {
    if (vendor === "openai") {
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
    } else if (vendor === "anthropic") {
      const settings: AnthropicSettings = {
        messages: [],
        model: "claude-3-opus-20240229" as AnthropicModel,
        maxTokens: 100,
      };
      const anthropicChat: ChatInterface = {
        id: uuidv4(),
        vendor: "anthropic",
        settings: settings,
      };
      setLLMs((currentLLMs) => [...currentLLMs, anthropicChat]);
    } else if (vendor === "cohere") {
      const settings: CohereSettings = {
        messages: [],
        model: "command-r-plus",
      };
      const cohereChat: ChatInterface = {
        id: uuidv4(),
        vendor: "cohere",
        settings: settings,
      };
      setLLMs((currentLLMs) => [...currentLLMs, cohereChat]);
    } else if (vendor === "groq") {
      const settings: GroqSettings = {
        messages: [],
        model: "llama3-8b-8192",
      };
      const cohereChat: ChatInterface = {
        id: uuidv4(),
        vendor: "groq",
        settings: settings,
      };
      setLLMs((currentLLMs) => [...currentLLMs, cohereChat]);
    } else if (vendor === "perplexity") {
      const settings: PerplexitySettings = {
        messages: [],
        model: "mistral-7b-instruct",
      };
      const perplexityChat: ChatInterface = {
        id: uuidv4(),
        vendor: "perplexity",
        settings: settings,
      };
      setLLMs((currentLLMs) => [...currentLLMs, perplexityChat]);
    }
  };

  return (
    <div className="px-12 py-6 flex flex-col gap-8">
      <span className="text-sm font-semibold">
        Note: Dont forget to add your LLM provider API keys in the{" "}
        <Link href="/settings/keys" className="underline text-blue-400">
          settings page.
        </Link>
      </span>
      <div className="flex flex-row flex-wrap lg:grid lg:grid-cols-3 gap-8 w-full">
        {llms.map((llm: ChatInterface) => (
          <LLMChat
            key={llm.id}
            llm={llm}
            setLLM={(updatedLLM: ChatInterface) => {
              const newLLMs = llms.map((l) =>
                l.id === llm.id ? updatedLLM : l
              );
              setLLMs(newLLMs);
            }}
            onRemove={() => handleRemove(llm.id)}
          />
        ))}
        <AddLLMChat onAdd={(vendor: string) => handleAdd(vendor)} />
      </div>
    </div>
  );
}
