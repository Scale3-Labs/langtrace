import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      redirect("/login");
    }
    // calculate the total count of traces
    const projectId = req.nextUrl.searchParams.get("id") as string;
    if (!projectId) {
      return NextResponse.json(
        {
          message: "No project id provided",
        },
        { status: 404 }
      );
    }

    // get the promptsets for the project
    const promptsets = await prisma.promptset.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result: any[] = [];
    for (const promptset of promptsets) {
      const totalPrompts = await prisma.prompt.count({
        where: {
          promptsetId: promptset.id,
        },
      });
      result.push({
        promptset,
        totalPrompts,
      });
    }
    return NextResponse.json({
      result,
    });
  } catch (error) {
    return NextResponse.json(JSON.stringify({ message: error }), {
      status: 400,
    });
  }
}
