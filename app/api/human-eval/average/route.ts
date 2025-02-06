import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
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

    // Get human evaluations for the project and type
    const humanEvals = await prisma.evaluation.findMany({
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
      select: {
        Test: {
          select: {
            name: true,
            id: true,
            min: true,
            max: true,
          },
        },
        ltUserScore: true,
        spanDate: true,
        spanId: true,
        type: true,
      },
      orderBy: {
        spanDate: "asc",
      },
    });

    // Group scores by test name
    const scoresByTest = humanEvals.reduce(
      (
        acc: Record<
          string,
          {
            scores: number[];
            scaleMin: number;
            scaleMax: number;
          }
        >,
        evaluation
      ) => {
        if (!evaluation.Test) return acc;

        const name = evaluation.Test.name.replace(/\s+/g, "-");
        const score = evaluation.ltUserScore ?? 0;

        if (!acc[name]) {
          acc[name] = {
            scores: [],
            scaleMin: evaluation.Test.min ?? 0,
            scaleMax: evaluation.Test.max ?? 100,
          };
        }

        acc[name].scores.push(score);
        return acc;
      },
      {}
    );

    // Calculate normalized statistics
    const statistics = Object.entries(scoresByTest).map(([name, data]) => {
      const { scores, scaleMin, scaleMax } = data;
      const range = scaleMax - scaleMin;

      // Normalize scores to 0-100 range
      const normalizedScores = scores.map(
        (score) => ((score - scaleMin) / range) * 100
      );

      // Calculate average and median
      const average =
        normalizedScores.reduce((sum, score) => sum + score, 0) /
        normalizedScores.length;
      const sortedScores = [...normalizedScores].sort((a, b) => a - b);
      const middle = Math.floor(sortedScores.length / 2);
      const median =
        sortedScores.length % 2 === 0
          ? (sortedScores[middle - 1] + sortedScores[middle]) / 2
          : sortedScores[middle];

      return [
        { stat: "average", value: Math.round(average), metric: name },
        { stat: "median", value: Math.round(median), metric: name },
      ];
    });

    return NextResponse.json(statistics);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
