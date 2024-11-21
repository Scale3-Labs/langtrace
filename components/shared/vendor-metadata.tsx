import { cn } from "@/lib/utils";
import { StackIcon } from "@radix-ui/react-icons";
import Image from "next/image";

interface Span {
  name: string;
  start_time: string;
  end_time: string;
  attributes: any;
  children?: Span[];
}

export function vendorBadgeColor(vendor: string) {
  if (!vendor) {
    return "bg-gray-500";
  }
  if (vendor.includes("openai")) {
    return "bg-blue-500";
  }

  if (vendor.includes("mistral")) {
    return "bg-orange-500";
  }

  if (vendor.includes("milvus")) {
    return "bg-blue-500";
  }

  if (vendor.includes("anthropic")) {
    return "bg-yellow-500";
  }

  if (vendor.includes("pinecone")) {
    return "bg-green-500";
  }

  if (vendor.includes("chroma")) {
    return "bg-cyan-500";
  }

  if (vendor.includes("langchain")) {
    return "bg-purple-500";
  }

  if (vendor.includes("llamaindex")) {
    return "bg-indigo-500";
  }

  if (vendor.includes("cohere")) {
    return "bg-red-500";
  }

  if (vendor.includes("qdrant")) {
    return "bg-grey-500";
  }

  if (vendor.includes("dspy")) {
    return "bg-red-500";
  }

  if (vendor.includes("weaviate")) {
    return "bg-green-500";
  }

  if (vendor.includes("pg")) {
    return "bg-blue-500";
  }

  if (vendor.includes("crewai")) {
    return "bg-red-500";
  }

  if (vendor.includes("litellm")) {
    return "bg-blue-500";
  }

  return "bg-gray-500";
}

export function vendorColor(vendor: string) {
  if (!vendor) {
    return "bg-gray-200";
  }

  if (vendor.includes("crewai")) {
    return "bg-red-200";
  }

  if (vendor.includes("milvus")) {
    return "bg-blue-200";
  }

  if (vendor.includes("perplexity")) {
    return "bg-slate-200";
  }

  if (vendor.includes("openai")) {
    return "bg-blue-200";
  }

  if (vendor.includes("mistral")) {
    return "bg-orange-200";
  }

  if (vendor.includes("anthropic")) {
    return "bg-yellow-200";
  }

  if (vendor.includes("pinecone")) {
    return "bg-green-200";
  }

  if (vendor.includes("chroma")) {
    return "bg-cyan-200";
  }

  if (vendor.includes("langchain")) {
    return "bg-purple-200";
  }

  if (vendor.includes("llamaindex")) {
    return "bg-indigo-200";
  }

  if (vendor.includes("cohere")) {
    return "bg-red-200";
  }

  if (vendor.includes("qdrant")) {
    return "bg-grey-200";
  }

  if (vendor.includes("groq")) {
    return "bg-slate-200";
  }

  if (vendor.includes("dspy")) {
    return "bg-red-200";
  }

  if (vendor.includes("weaviate")) {
    return "bg-green-200";
  }

  if (vendor.includes("pg")) {
    return "bg-blue-200";
  }

  if (vendor.includes("vertex")) {
    return "bg-blue-200";
  }

  if (vendor.includes("gemini")) {
    return "bg-blue-200";
  }

  if (vendor.includes("embedchain")) {
    return "bg-slate-200";
  }

  if (vendor.includes("vercel")) {
    return "bg-black";
  }

  if (vendor.includes("mongodb")) {
    return "bg-green-200";
  }

  if (vendor.includes("guardrails")) {
    return "bg-green-200";
  }

  return "bg-gray-800";
}

export function serviceTypeColor(serviceType: string) {
  if (serviceType === "llm") {
    return "bg-purple-500";
  } else if (serviceType === "framework") {
    return "bg-blue-500";
  } else if (serviceType === "vectordb") {
    return "bg-green-500";
  }
  return "bg-gray-500";
}

export function VendorLogo({
  vendor,
  variant = "default",
}: {
  vendor: string;
  variant?: string;
}) {
  if (vendor.includes("groq")) {
    const color = vendorColor("groq");
    return (
      <Image
        alt="Groq Logo"
        src="/groq.png"
        width={50}
        height={50}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("perplexity")) {
    const color = vendorColor("perplexity");
    return (
      <Image
        alt="Perplexity Logo"
        src="/perplexity.png"
        width={20}
        height={20}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("openai")) {
    const color = vendorColor("openai");
    return (
      <Image
        alt="OpenAI Logo"
        src="/openai.svg"
        width={20}
        height={20}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("anthropic")) {
    const color = vendorColor("anthropic");
    return (
      <Image
        alt="Anthropic Logo"
        src="/anthropic.png"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("pinecone")) {
    const color = vendorColor("pinecone");
    return (
      <Image
        alt="Pinecone Logo"
        src="/pinecone.png"
        width={20}
        height={20}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("chroma")) {
    const color = vendorColor("chroma");
    return (
      <Image
        alt="ChromaDB Logo"
        src="/chroma.png"
        width={25}
        height={25}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("langchain") || vendor.includes("langgraph")) {
    const color = vendorColor("langchain");
    return (
      <Image
        alt="Langchain Logo"
        src="/langchain.svg"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("llamaindex")) {
    const color = vendorColor("llamaindex");
    return (
      <Image
        alt="LlamaIndex Logo"
        src="/llamaindex.svg"
        width={60}
        height={80}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("cohere")) {
    const color = vendorColor("cohere");
    return (
      <Image
        alt="Cohere Logo"
        src="/cohere.png"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("crewai")) {
    const color = vendorColor("crewai");
    return (
      <Image
        alt="CrewAI Logo"
        src="/crewai.png"
        width={60}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("vercel")) {
    const color = vendorColor("vercel");
    return (
      <Image
        alt="Vercel Logo"
        src="/vercel.png"
        width={60}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("xai")) {
    const color = vendorColor("vercel");
    return (
      <Image
        alt="XAI Logo"
        src="/vercel.png"
        width={60}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("xai")) {
    const color = vendorColor("vercel");
    return (
      <Image
        alt="XAI Logo"
        src="/xai.png"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("embedchain")) {
    const color = vendorColor("embedchain");
    return (
      <Image
        alt="Mem0 Logo"
        src="/mem0.png"
        width={60}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("qdrant")) {
    const color = vendorColor("qdrant");
    return (
      <Image
        alt="Qdrant Logo"
        src="/qdrant.png"
        width={50}
        height={50}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("dspy")) {
    const color = vendorColor("dspy");
    return (
      <Image
        alt="DSPy Logo"
        src="/dspy.png"
        width={50}
        height={50}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("weaviate")) {
    const color = vendorColor("weaviate");
    return (
      <Image
        alt="Weaviate Logo"
        src="/weaviate.png"
        width={50}
        height={50}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("pg")) {
    const color = vendorColor("pg");
    return (
      <Image
        alt="Postgres Logo"
        src="/pg.png"
        width={50}
        height={50}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("vertex")) {
    const color = vendorColor("vertex");
    return (
      <Image
        alt="Vertex AI Logo"
        src="/vertexai.svg"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("gemini")) {
    const color = vendorColor("gemini");
    return (
      <Image
        alt="Gemini Logo"
        src="/gemini.jpeg"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("litellm")) {
    const color = vendorColor("litellm");
    return (
      <Image
        alt="LiteLLM Logo"
        src="/litellm.png"
        width={50}
        height={50}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("mistral")) {
    const color = vendorColor("mistral");
    return (
      <Image
        alt="Mistral Logo"
        src="/mistral.png"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("milvus")) {
    const color = vendorColor("milvus");
    return (
      <Image
        alt="Milvus Logo"
        src="/milvus.png"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("mongodb")) {
    const color = vendorColor("mongodb");
    return (
      <Image
        alt="MongoDB Logo"
        src="/mongodb.png"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  if (vendor.includes("guardrails")) {
    const color = vendorColor("guardrails");
    return (
      <Image
        alt="Guardrails Logo"
        src="/guardrails.png"
        width={30}
        height={30}
        className={cn(
          `${color} p-[3px]`,
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    );
  }

  return (
    <div className="flex items-center p-1 rounded-sm">
      <StackIcon
        className={cn(
          "w-4 h-4 text-primary",
          variant === "circular" ? "rounded-full" : "rounded-md"
        )}
      />
    </div>
  );
}
