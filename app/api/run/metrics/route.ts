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
    let evaluationMetrics: any = {};
    const body: any = {
      projectId,
    };
    if (datasetId) {
      body["datasetId"] = datasetId;
    }
    const totalEvaluations = await prisma.run.count({
      where: body,
    });
    const runs = await prisma.run.findMany({
      where: body,
    });

    for (const run of runs) {
      const logs: any = run.log || {};
      const parsedLogs = JSON.parse(logs);
      const scorers = parsedLogs?.results?.scores || [];
      const model = parsedLogs?.eval?.model || "model-unspecified";
      for (const scorer of scorers) {
        if (scorer.name && !evaluationMetrics[scorer.name]) {
          evaluationMetrics[scorer.name] = [];
        }
        if (scorer?.metrics) {
          for (const metric of Object.keys(scorer.metrics)) {
            let existingMetric = evaluationMetrics[scorer.name].find(
              (m: any) => m.name === metric
            );
            if (!existingMetric) {
              evaluationMetrics[scorer.name].push({
                name: metric,
                scores: [],
              });
            }
            existingMetric = evaluationMetrics[scorer.name].find(
              (m: any) => m.name === metric
            );
            const existingModel = existingMetric.scores.find(
              (m: any) => m.model === model
            );
            if (existingModel) {
              existingModel[metric] +=
                parseFloat(scorer.metrics[metric]?.value) || 0;
            } else {
              existingMetric.scores.push({
                model: model,
                [metric]: parseFloat(scorer.metrics[metric]?.value) || 0,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      total_evaluations: totalEvaluations,
      evaluation_metrics: evaluationMetrics,
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
