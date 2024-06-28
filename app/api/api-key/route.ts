import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const teamId = req.nextUrl.searchParams.get("teamId") as string;
    const projectId = req.nextUrl.searchParams.get("projectId") as string;

    if (!teamId && !projectId) {
      return NextResponse.json(
        {
          error: "No projectId or teamId provided",
        },
        { status: 404 }
      );
    }

    if (teamId) {
      const result = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });

      return NextResponse.json({
        data: result,
      });
    }

    if (projectId) {
      const result = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

      return NextResponse.json({
        data: result,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
