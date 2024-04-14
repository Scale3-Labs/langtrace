import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  try {
    const projectId = req.nextUrl.searchParams.get("projectId") as string;

    if (!projectId) {
      return NextResponse.json(
        {
          message: "projectId not provided",
        },
        { status: 400 }
      );
    }

    // calculate the total count of traces
    const traceService = new TraceService();
    const totalSpans = await traceService.GetTotalSpansPerProject(projectId);
    const totalTraces = await traceService.GetTotalTracesPerProject(projectId);
    const totalEvaluations = await prisma.evaluation.count({
      where: {
        projectId,
      },
    });
    const totalDatasets = await prisma.dataset.count({
      where: {
        projectId,
      },
    });
    const totalPromptsets = await prisma.promptset.count({
      where: {
        projectId,
      },
    });

    return NextResponse.json({
      totalSpans,
      totalTraces,
      totalEvaluations,
      totalDatasets,
      totalPromptsets,
    });
  } catch (error) {
    return NextResponse.json(JSON.stringify({ error }), {
      status: 400,
    });
  }
}
