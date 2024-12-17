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

    // Group evaluations by date and test name, summing scores for same test on same date
    const groupedData = humanEvals.reduce(
      (acc: Record<string, Record<string, number>>, evaluation) => {
        if (!evaluation.Test) return acc; // Skip if no Test data

        const date = evaluation.spanDate.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = {};
        }
        const name = evaluation.Test.name.replace(/\s+/g, "-");
        const score = evaluation.ltUserScore ?? 0;

        // Sum up scores for the same test on the same date
        acc[date][name] = (acc[date][name] || 0) + score;
        return acc;
      },
      {}
    );

    // Convert to array format
    const chartData = Object.entries(groupedData).map(([date, scores]) => ({
      date,
      ...scores,
    }));

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
