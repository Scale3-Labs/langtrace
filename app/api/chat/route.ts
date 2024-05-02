import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const data = await req.json();
  const isStream = data.stream;

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
}
