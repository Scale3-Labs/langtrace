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

    // Group evaluations by date and test name, tracking sum and count for averaging
    const groupedData = humanEvals.reduce(
      (
        acc: Record<
          string,
          Record<
            string,
            { sum: number; count: number; min: number; max: number }
          >
        >,
        evaluation
      ) => {
        if (!evaluation.Test) return acc;

        const date = evaluation.spanDate.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = {};
        }

        const name = evaluation.Test.name.replace(/\s+/g, "-");
        const score = evaluation.ltUserScore ?? 0;
        const minScore = evaluation.Test.min ?? 0;
        const maxScore = evaluation.Test.max ?? 100;

        if (!acc[date][name]) {
          acc[date][name] = { sum: 0, count: 0, min: minScore, max: maxScore };
        }

        acc[date][name].sum += score;
        acc[date][name].count += 1;
        return acc;
      },
      {}
    );

    // Convert to array format with normalized averages
    const chartData = Object.entries(groupedData).map(([date, scores]) => {
      const normalizedScores: Record<string, number> = {};

      Object.entries(scores).forEach(([testName, data]) => {
        const average = data.sum / data.count;
        // Normalize to 0-100 scale
        const normalized = ((average - data.min) / (data.max - data.min)) * 100;
        normalizedScores[testName] = Number(normalized.toFixed(2));
      });

      return {
        date,
        ...normalizedScores,
      };
    });

    return NextResponse.json(chartData);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
