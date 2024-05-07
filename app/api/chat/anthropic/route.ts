import Anthropic from "@anthropic-ai/sdk";
import { AnthropicStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const isStream = data.stream;
    const apiKey = data.apiKey;

    // Create an Anthropic API client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // remove apiKey from the body
    delete data.apiKey;

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await anthropic.messages.create({
      ...data,
    });

    // Convert the response into a friendly text-stream
    if (isStream) {
      const stream = AnthropicStream(response as any);
      return new StreamingTextResponse(stream);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || "Something went wrong",
      status: error?.status || error?.message.includes("apiKey") ? 401 : 500,
    });
  }
}
