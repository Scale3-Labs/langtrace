import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { authApiKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    let projectId = "";
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      const apiKey = req.headers.get("x-api-key");
      if (!apiKey) {
        redirect("/login");
      }

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

    // Get run by id
    const runId = req.nextUrl.searchParams.get("runId");
    if (runId) {
      const run = await prisma.run.findFirst({
        where: {
          projectId: projectId,
          runId: runId,
        },
      });

      return NextResponse.json({
        run: run,
      });
    }

    // Get runs
    const pageParam = req.nextUrl.searchParams.get("page");
    const pageSizeParam = req.nextUrl.searchParams.get("pageSize");
    let page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10;

    const totalLen = await prisma.run.count({
      where: {
        projectId: projectId,
      },
    });

    const totalPages =
      Math.ceil(totalLen / pageSize) === 0 ? 1 : Math.ceil(totalLen / pageSize);
    const md = { page, page_size: pageSize, total_pages: totalPages };

    if (page! > totalPages) {
      page = totalPages;
    }

    const runs = await prisma.run.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return NextResponse.json({
      runs: runs,
      metadata: md,
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

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    redirect("/login");
  }

  const response = await authApiKey(apiKey!);
  if (response.status !== 200) {
    return response;
  }

  // Get project data
  const projectData = await response.json();
  const projectId = projectData.data.project.id;

  const d = await req.json();
  const { runId, taskId, description, wfVersion, log, datasetId } = d;

  const payload: any = {
    runId,
    taskId,
    log,
    projectId,
  };

  if (description) {
    payload["description"] = description;
  }
  if (wfVersion) {
    payload["wfVersion"] = wfVersion;
  }
  if (datasetId) {
    payload["datasetId"] = datasetId;
  }

  const run = await prisma.run.create({
    data: payload,
  });

  return NextResponse.json({
    run: run,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const d = await req.json();
  const { id, description, wfVersion, datasetId } = d;
  const payload: any = {};
  if (description) {
    payload["description"] = description;
  }
  if (wfVersion) {
    payload["wfVersion"] = wfVersion;
  }
  if (datasetId) {
    payload["datasetId"] = datasetId;
  }

  const run = await prisma.dataset.update({
    where: {
      id,
    },
    data: payload,
  });

  return NextResponse.json({
    run: run,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  await prisma.run.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
