import { OpenAIStream, StreamingTextResponse } from "ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const isStream = data.stream;
    const apiKey = data.apiKey;

    // Create an Groq API client (that's edge friendly!)
    const groq = new Groq({
      apiKey: apiKey,
    });

    // remove apiKey from the body
    delete data.apiKey;

    // Ask Groq for a streaming chat completion given the prompt
    const response = await groq.chat.completions.create({
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
