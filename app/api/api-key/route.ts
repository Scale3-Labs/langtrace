import prisma from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// for generating new API key
export async function POST(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project_id") as string;
  const teamId = req.nextUrl.searchParams.get("team_id") as string;

  if (!projectId && !teamId) {
    return NextResponse.json(
      {
        error: "Missing project_id or team_id",
      },
      { status: 400 }
    );
  }

  const apiKey = generateApiKey();
  const hash = hashApiKey(apiKey);

  if (projectId) {
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        apiKeyHash: hash,
      },
    });
  } else if (teamId) {
    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        apiKeyHash: hash,
      },
    });
  }

  return NextResponse.json({
    data: {
      apiKey: apiKey,
    },
  });
}
