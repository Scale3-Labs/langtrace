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

  return "bg-gray-500";
}

export function vendorColor(vendor: string) {
  if (!vendor) {
    return "bg-gray-200";
  }

  if (vendor.includes("perplexity")) {
    return "bg-slate-200";
  }

  if (vendor.includes("openai")) {
    return "bg-blue-200";
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

export function VendorLogo({ span }: { span: Span }) {
  const attributes = span.attributes ? JSON.parse(span.attributes) : {};
  let serviceName = "";
  if (attributes["langtrace.service.name"]) {
    serviceName = attributes["langtrace.service.name"].toLowerCase();
  }

  if (span.name.includes("perplexity") || serviceName.includes("perplexity")) {
    const color = vendorColor("perplexity");
    return (
      <Image
        alt="Perplexity Logo"
        src="/perplexity.png"
        width={20}
        height={20}
        className={`${color} p-[3px] rounded-sm`}
      />
    );
  }

  if (span.name.includes("openai") || serviceName.includes("openai")) {
    const color = vendorColor("openai");
    return (
      <Image
        alt="OpenAI Logo"
        src="/openai.svg"
        width={20}
        height={20}
        className={`${color} p-[3px] rounded-sm`}
      />
    );
  }

  if (span.name.includes("anthropic") || serviceName.includes("anthropic")) {
    const color = vendorColor("anthropic");
    return (
      <Image
        alt="Anthropic Logo"
        src="/anthropic.png"
        width={30}
        height={30}
        className="p-[3px] rounded-md"
      />
    );
  }

  if (span.name.includes("pinecone") || serviceName.includes("pinecone")) {
    const color = vendorColor("pinecone");
    return (
      <Image
        alt="Pinecone Logo"
        src="/pinecone.png"
        width={20}
        height={20}
        className={`${color} p-[3px] rounded-sm`}
      />
    );
  }

  if (span.name.includes("chromadb") || serviceName.includes("chromadb")) {
    const color = vendorColor("chromadb");
    return (
      <Image
        alt="ChromaDB Logo"
        src="/chroma.png"
        width={25}
        height={25}
        className={`${color} p-[3px] rounded-sm`}
      />
    );
  }

  if (span.name.includes("langchain") || serviceName.includes("langchain")) {
    const color = vendorColor("langchain");
    return (
      <Image
        alt="Langchain Logo"
        src="/langchain.svg"
        width={30}
        height={30}
        className={`${color} p-[3px] rounded-sm`}
      />
    );
  }

  if (span.name.includes("llamaindex") || serviceName.includes("llamaindex")) {
    const color = vendorColor("llamaindex");
    return (
      <Image
        alt="LlamaIndex Logo"
        src="/llamaindex.svg"
        width={60}
        height={80}
        className={`${color} p-[3px] rounded-sm`}
      />
    );
  }

  const color = vendorColor("langtrace");
  return (
    <div className="flex items-center bg-muted p-2 rounded-sm">
      <StackIcon className={"w-4 h-4 text-primary rounded-sm"} />
    </div>
  );
}
