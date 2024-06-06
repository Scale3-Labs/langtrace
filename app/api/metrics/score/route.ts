import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { Evaluation } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { projectId, testIds, lastNHours, filters, filterOperation } =
    await req.json();

  if (!projectId) {
    return NextResponse.json(
      {
        error: "Please provide a projectId",
      },
      { status: 400 }
    );
  }

  // check if this user has access to this project
  const email = session?.user?.email as string;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "user not found",
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
        error: "User does not have access to this project",
      },
      { status: 403 }
    );
  }

  let evaluations: Evaluation[] = [];
  const traceService = new TraceService();

  //Fetch last N hours of spanIds from clickhouse
  const spans = await traceService.GetSpansInProject(
    projectId,
    lastNHours,
    filters,
    filterOperation
  );

  const result = [];
  for (const testId of testIds) {
    // get evaluation for the lastNDays
    // and all evaluations where score is not 0
    evaluations = await prisma.evaluation.findMany({
      where: {
        projectId,
        testId,
        spanId: { in: [...spans.map((span) => span.span_id)] },
      },
    });
    if (!evaluations) {
      result.push({
        testId,
        overall: 0,
        perday: [],
      });
      continue;
    }
    const evalsByDate: Record<string, Evaluation[]> = {};
    evaluations.forEach((evaluation, index) => {
      const span = spans.find((span) => span.span_id === evaluation.spanId);
      if (!span) {
        return;
      }
      const date = span.start_time.split("T")[0];
      if (evalsByDate[date]) {
        evalsByDate[date].push(evaluation);
      } else {
        evalsByDate[date] = [evaluation];
      }
    });
    let totalPositive = 0;
    let totalNegative = 0;

    const perday = Object.entries(evalsByDate).map(([date, scores]) => {
      let totalPositivePerDay = 0;
      let totalNegativePerDay = 0;

      scores.forEach((score) => {
        if (score.ltUserScore !== null) {
          if (score.ltUserScore > 0) {
            totalPositivePerDay += score.ltUserScore;
            totalPositive += score.ltUserScore;
          } else {
            // make it positive
            totalNegativePerDay += Math.abs(score.ltUserScore);
            totalNegative += Math.abs(score.ltUserScore);
          }
        }
      });
      const res =
        (totalPositivePerDay / (totalPositivePerDay + totalNegativePerDay)) *
        100;
      return {
        date,
        score: res,
      };
    });
    perday.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    // calculate average
    const overall = (totalPositive / (totalPositive + totalNegative)) * 100;

    result.push({
      testId,
      overall,
      perday,
    });
  }

  return NextResponse.json(result);
}
