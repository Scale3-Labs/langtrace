import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const isStream = data.stream;
    const apiKey = data.apiKey;

    delete data.apiKey;

    // MiniMax uses an OpenAI-compatible API
    const minimax = new OpenAI({
      apiKey: apiKey || "",
      baseURL: "https://api.minimax.io/v1",
    });

    // Clamp temperature to MiniMax's supported range [0, 1]
    if (data.temperature !== undefined) {
      data.temperature = Math.min(Math.max(data.temperature, 0), 1);
    }

    const response = await minimax.chat.completions.create({
      ...data,
    });

    // Convert the response into a friendly text-stream
    if (isStream) {
      const stream = OpenAIStream(response as any);
      return new StreamingTextResponse(stream);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || "Something went wrong",
      status: error?.status || 500,
    });
  }
}
