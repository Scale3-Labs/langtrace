import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const projectId = req.nextUrl.searchParams.get("projectId") as string;

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

  const tests = await prisma.test.findMany({
    where: {
      projectId,
    },
  });

  const averages: any[] = [];
  // get the evaluations for each test and calculate the average
  for (const test of tests) {
    const evaluations = await prisma.evaluation.findMany({
      where: {
        testId: test.id,
      },
    });

    const totalPositive = evaluations.reduce((acc, evaluation) => {
      if (evaluation.score === 1) {
        return acc + 1;
      }
      return acc;
    }, 0);

    const totalNegative = evaluations.reduce((acc, evaluation) => {
      if (evaluation.score === -1) {
        return acc + 1;
      }
      return acc;
    }, 0);

    // calculate average
    const average = (totalPositive / (totalPositive + totalNegative)) * 100;

    averages.push({
      testId: test.id,
      average,
    });
  }

  return NextResponse.json({
    averages,
  });
}
