import prisma from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// for generating new API key
export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") as string;

  if (!id) {
    return NextResponse.json(
      {
        error: "Missing project id",
      },
      { status: 400 }
    );
  }

  const apiKey = generateApiKey();
  const hash = hashApiKey(apiKey);

  await prisma.project.update({
    where: {
      id,
    },
    data: {
      apiKeyHash: hash,
    },
  });

  return NextResponse.json({
    data: {
      apiKey: apiKey,
    },
  });
}
