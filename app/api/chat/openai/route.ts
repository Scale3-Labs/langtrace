import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const isStream = data.stream;
    const apiKey = data.apiKey;

    // Create an OpenAI API client (that's edge friendly!)
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // remove apiKey from the body
    delete data.apiKey;

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.chat.completions.create({
      ...data,
    });

    // Convert the response into a friendly text-stream
    if (isStream) {
      const stream = OpenAIStream(response as any);
      return new StreamingTextResponse(stream);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong" },
      { status: error?.status || 500 }
    );
  }
}
