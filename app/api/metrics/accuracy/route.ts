import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { Evaluation } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const projectId = req.nextUrl.searchParams.get("projectId") as string;
  const testId = req.nextUrl.searchParams.get("testId") as string;
  let lastNDays = Number(req.nextUrl.searchParams.get("lastNDays"));
  let overallAccuracy = 0

  if(Number.isNaN(lastNDays) || lastNDays < 0){
    lastNDays = 7;
  }

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
    //Fetch last 7 days of spanIds from clickhouse
  const spans =  await traceService.GetSpansInProject(
    projectId,
    lastNDays
  );

  // get evalutaion for the last 7 days
  // and all evaluations where score is 1 or -1
  evaluations = await prisma.evaluation.findMany({
    where: {
      projectId,
      testId,
      spanId: { in: [...spans.map((span) => span.span_id)]},
      ltUserScore: {
        in: [1, -1],
      }
    },
  });
  if (!evaluations) {
    return NextResponse.json({ accuracyPerDay: [], overallAccuracy: null }, { status: 200 });
  }
  const evalsByDate: Record<string, Evaluation[]> = {};
  evaluations.forEach((evaluation, index) => {
    const span = spans[index];
    const date = span.start_time.split("T")[0];
    if(evalsByDate[date]){
      evalsByDate[date].push(evaluation);
    } else {
      evalsByDate[date] = [evaluation];
    }
  })
  let totalPositive = 0;
  let totalNegative = 0;

  const accuracyPerDay = Object.entries(evalsByDate).map(([date, scores]) => {
    let totalPositivePerDay = 0;
    let totalNegativePerDay = 0;

    scores.forEach((score) => {
      if (score.ltUserScore === 1) {
        totalPositivePerDay += 1;
        totalPositive += 1;
      } else {
        totalNegativePerDay+= 1;
        totalNegative += 1;
      }
    });
    const accuracy = (totalPositive / (totalPositive + totalNegative)) * 100;
    return {
      date,
      accuracy,
    };
  });
  accuracyPerDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // calculate average
  overallAccuracy = (totalPositive / (totalPositive + totalNegative)) * 100;

  return NextResponse.json({
    overallAccuracy,
    accuracyPerDay
  });
}
