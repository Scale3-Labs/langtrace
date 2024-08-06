import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    const datasetId = req.nextUrl.searchParams.get("datasetId") as string;

    if (!projectId && !datasetId) {
      return NextResponse.json(
        {
          message: "projectId or datasetId is required",
        },
        { status: 400 }
      );
    }

    // check if user has access to the project
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

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        teamId: user.teamId,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          message:
            "Project not found or user does not have access to this project",
        },
        { status: 403 }
      );
    }

    // fetch count of runs for the project or dataset
    let totalEvaluations = 0;
    if (datasetId) {
      totalEvaluations = await prisma.run.count({
        where: {
          datasetId,
        },
      });
    } else {
      totalEvaluations = await prisma.run.count({
        where: {
          projectId,
        },
      });
    }

    return NextResponse.json({
      total_evaluations: totalEvaluations,
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
