import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { authApiKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const apiKey = req.headers.get("x-api-key");
    let projectId = req.nextUrl.searchParams.get("projectId") as string;
    if ((!session || !session.user) && !apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (apiKey) {
      const response = await authApiKey(apiKey);
      if (response.status !== 200) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const projectData = await response.json();
      projectId = projectData.data.project.id;
    }

    const spanId = req.nextUrl.searchParams.get("spanId") as string;

    if (!projectId && !spanId) {
      return NextResponse.json(
        {
          message: "Please provide a projectId or spanId",
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

    let evaluations: any;
    const traceService = await new TraceService();
    const span = await traceService.GetSpanById(spanId, projectId);
    // if spanId is not found in the trace, return an empty array
    // this often happens when spanId is being stored and send user feedback call is simultaneously made
    if (span) {
      evaluations = await prisma.evaluation.findMany({
        where: {
          traceId: span.trace_id,
        },
      });
    }
    if (!evaluations) {
      return NextResponse.json({
        evaluations: [],
      });
    }

    return NextResponse.json({
      evaluations: Array.isArray(evaluations) ? evaluations : [evaluations],
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
