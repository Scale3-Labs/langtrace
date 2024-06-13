import {
  DatabaseSpanAttributeNames,
  FrameworkSpanAttributeNames,
  LLMSpanAttributeNames,
} from "@langtrase/trace-attributes";
import { extractPropertyNames } from "./utils";

export const Vendors = {
  openai: "openai",
  cohere: "cohere",
  anthropic: "anthropic",
  groq: "groq",
  pinecone: "pinecone",
  llamaindex: "llamaindex",
  chromadb: "chromadb",
  qdrant: "qdrant",
  pg: "pg",
} as const;

export const Events = [
  "stream.start",
  "stream.output",
  "stream.end",
  "response",
];

export type SupportedVendors = (typeof Vendors)[keyof typeof Vendors];

export const OPENAI_APIS = [
  "openai.chat.completion",
  "openai.chat.completions.create",
  "openai.images.generate",
  "openai.images.edit",
];
export const COHERE_APIS = [
  "cohere.chat",
  "cohere.chatStream",
  "cohere.embed",
  "cohere.embedJobs.create",
  "cohere.rerank",
];

export const ANTHROPIC_APIS = ["anthropic.messages.create"];

export const GROQ_APIS = ["groq.chat.completions.create"];

export const PINECONE_APIS = [
  "pinecone.index.upsert",
  "pinecone.index.query",
  "pinecone.index.deleteOne",
  "pinecone.index.deleteMany",
  "pinecone.index.deleteAll",
];

export const LLAMAINDEX_APIS = [
  "llamaindex.RetrieverQueryEngine.query",
  "llamaindex.RetrieverQueryEngine.retrieve",
  "llamaindex.VectorIndexRetriever.retrieve",
  "llamaindex.SimpleVectorStore.query",
  "llamaindex.OpenAI.chat",
];

export const CHROMADB_APIS = [
  "chromadb.collection.add",
  "chromadb.collection.query",
  "chromadb.collection.delete",
  "chromadb.collection.peek",
  "chromadb.collection.update",
  "chromadb.collection.modify",
  "chromadb.collection.count",
];

export const QDRANT_APIS = [
  "qdrantdb.get_collection",
  "qdrantdb.get_collections",
  "qdrantdb.delete",
  "qdrantdb.discover",
  "qdrantdb.discover_batch",
  "qdrantdb.recommend",
  "qdrantdb.recommend_batch",
  "qdrantdb.retrieve",
  "qdrantdb.search",
  "qdrantdb.search_batch",
  "qdrantdb.upsert",
  "qdrantdb.count",
  "qdrantdb.update_collection",
  "qdrantdb.update_vectors",
];

export const PG_APIS = ["pg.Client.query"];

export const SpanAttributes = extractPropertyNames(
  DatabaseSpanAttributeNames,
  FrameworkSpanAttributeNames,
  LLMSpanAttributeNames
);

export const TracedFunctionsByVendor = {
  openai: OPENAI_APIS,
  cohere: COHERE_APIS,
  anthropic: ANTHROPIC_APIS,
  groq: GROQ_APIS,
  pinecone: PINECONE_APIS,
  llamaindex: LLAMAINDEX_APIS,
  chromadb: CHROMADB_APIS,
  qdrant: QDRANT_APIS,
  pg: PG_APIS,
};
