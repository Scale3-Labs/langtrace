import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
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
  const byModel = req.nextUrl.searchParams.get("by_model") as string;

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

  // get evalutaion for the last 7 days
  const evaluations = await prisma.evaluation.findMany({
    where: {
      projectId,
      spanStartTime: {
        gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  if (byModel === "true") {
    const evaluationsByModel = evaluations.reduce(
      (acc: any, evaluation: Evaluation) => {
        if (!evaluation.model) {
          return acc;
        }
        if (acc[evaluation.model]) {
          acc[evaluation.model].push(evaluation);
        } else {
          acc[evaluation.model] = [evaluation];
        }
        return acc;
      },
      {}
    );

    return NextResponse.json({
      evaluations: evaluationsByModel,
    });
  }

  if (!evaluations) {
    return NextResponse.json({ evalutions: [] }, { status: 200 });
  }

  return NextResponse.json({
    evaluations,
  });
}
