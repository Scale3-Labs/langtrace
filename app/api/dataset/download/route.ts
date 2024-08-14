import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { authApiKey } from "@/lib/utils";
import json2csv from "json2csv";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    let projectId = "";
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        redirect("/login");
      }
    } else {
      const response = await authApiKey(apiKey!);
      if (response.status !== 200) {
        return response;
      }

      // Get project data
      const projectData = await response.json();
      projectId = projectData.data.project.id;
    }

    if (!projectId) {
      projectId = req.nextUrl.searchParams.get("projectId") as string;
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          message: "No projects found",
        },
        { status: 404 }
      );
    }

    const datasetId = req.nextUrl.searchParams.get("id") as string;
    const pageParam = req.nextUrl.searchParams.get("page");
    let page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = 500;
    if (!datasetId) {
      return NextResponse.json(
        {
          message: "No dataset id provided",
        },
        { status: 404 }
      );
    }
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
      },
      include: {
        Data: true,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        {
          message: "No datasets found",
        },
        { status: 404 }
      );
    }

    const data = await prisma.data.findMany({
      where: {
        datasetId: dataset.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const result: any = [];
    // convert the data to include only input, output and annotatedOutput fields. Rename output to target
    data.forEach((d) => {
      result.push({
        input: d.input,
        target: d.output,
        expected_output: d.expectedOutput,
        model: d.model,
        note: d.note,
      });
    });

    const csv = json2csv.parse(result);
    const datasetName = dataset.name.toLowerCase().replace(/\s+/g, "_");
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, "");
    const filename = `${datasetName}_${timestamp}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `filename:${filename}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error downloading dataset",
      },
      { status: 500 }
    );
  }
}
