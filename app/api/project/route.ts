import { authOptions } from "@/lib/auth/options";
import { DEFAULT_TESTS } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { captureEvent } from "@/lib/services/posthog";
import { authApiKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const id = req.nextUrl.searchParams.get("id") as string;
  if (!id) {
    return NextResponse.json(
      {
        message: "project id not provided",
      },
      { status: 400 }
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
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

  return NextResponse.json({
    project: project,
  });
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }
  } else {
    const response = await authApiKey(apiKey, true);
    if (response.status !== 200) {
      return response;
    }
  }
  const data = await req.json();
  const { name, description, teamId, type } = data;
  let createDefaultTests = data.createDefaultTests;
  if (!createDefaultTests) {
    createDefaultTests = true; // default to true
  }

  let projectType = type;
  if (!type) {
    projectType = "default";
  }

  const project = await prisma.project.create({
    data: {
      name: name,
      description: description,
      teamId: teamId,
      type: projectType,
    },
  });

  if (createDefaultTests) {
    // create default tests
    for (const test of DEFAULT_TESTS) {
      await prisma.test.create({
        data: {
          name: test.name?.toLowerCase() ?? "",
          description: test.description ?? "",
          projectId: project.id,
        },
      });
    }

    await captureEvent(project.id, "project_created", {
      project_name: name,
      project_description: description,
      project_type: projectType,
    });
  }

  const { apiKeyHash, ...projectWithoutApiKeyHash } = project;

  return NextResponse.json({
    data: projectWithoutApiKeyHash,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id, name, description, teamId, apiKeyHash, type } = data;

  const project = await prisma.project.update({
    where: {
      id,
    },
    data: {
      name,
      description,
      apiKeyHash: apiKeyHash,
      teamId,
      type,
    },
  });

  return NextResponse.json({
    data: project,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  const project = await prisma.project.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    data: project,
  });
}
