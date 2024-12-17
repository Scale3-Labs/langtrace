import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type") as string;
    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    const lastXDays = req.nextUrl.searchParams.get("lastXDays") as string;

    if (!projectId) {
      return NextResponse.json(
        {
          message: "Please provide a projectId",
        },
        { status: 400 }
      );
    }

    // check if this user has access to this project
    if (session) {
      const email = session?.user?.email as string;
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        return NextResponse.json(
          {
            message: "user not found",
          },
          { status: 404 }
        );
      }

      // check if this user has access to this project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          teamId: user.teamId,
        },
      });
      if (!project) {
        return NextResponse.json(
          {
            message: "User does not have access to this project",
          },
          { status: 403 }
        );
      }
    }

    // Get count of human evaluations for the project and type
    const count = await prisma.evaluation.count({
      where: {
        projectId,
        type,
        Test: {
          isNot: null,
        },
        spanDate: {
          gte: new Date(Date.now() - Number(lastXDays) * 24 * 60 * 60 * 1000),
        },
      },
    });

    // get the total number of traces for this project
    const traceService = await new TraceService();
    const totalSpans = await traceService.GetTotalSpansOfTypeInLastXDays(
      projectId,
      type,
      lastXDays
    );

    if (totalSpans === 0 || count === 0 || !totalSpans || !count) {
      return NextResponse.json({ confidence: 0 });
    }

    // calculate the confidence
    const confidence = Math.round((count / totalSpans) * 100 * 100) / 100;

    if (confidence > 100) {
      return NextResponse.json({ confidence: 100 });
    }

    return NextResponse.json({ confidence });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
