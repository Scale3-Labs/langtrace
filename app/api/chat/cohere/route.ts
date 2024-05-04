import { CohereStream, StreamingTextResponse } from "ai";
import { CohereClient } from "cohere-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const isStream = data.stream;
    const apiKey = data.apiKey;

    // Create an Cohere API client
    const cohere = new CohereClient({
      token: apiKey,
    });

    // remove apiKey from the body
    delete data.apiKey;

    // extract last message from data.messages
    const lastMessage = data?.messages[data?.messages?.length - 1]?.message;

    // remove the last message from data.messages
    data.messages.pop();
    const messageHistory = data.messages;

    // delete data.messages;
    delete data.messages;

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await cohere.chat({
      chatHistory: messageHistory,
      message: lastMessage,
      ...data,
    });

    // Convert the response into a friendly text-stream
    if (isStream) {
      const stream = CohereStream(response as any);
      return new StreamingTextResponse(stream);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong" },
      { status: error?.status || error?.message.includes("apiKey") ? 401 : 500 }
    );
  }
}
