import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { authApiKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // check session
    let projectId = "";
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      // check api key
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

    const id = req.nextUrl.searchParams.get("id") as string;
    if (!projectId) {
      projectId = req.nextUrl.searchParams.get("projectId") as string;
    }
    if (!projectId && !id) {
      return NextResponse.json(
        {
          message: "projectId or id not provided",
        },
        { status: 400 }
      );
    }

    if (projectId) {
      const tests = await prisma.test.findMany({
        where: {
          projectId: projectId,
        },
      });

      if (!tests) {
        return NextResponse.json(
          {
            message: "No tests found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        tests,
      });
    }

    const test = await prisma.test.findUnique({
      where: {
        id,
      },
    });

    if (!test) {
      return NextResponse.json(
        {
          message: "Test not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      test,
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
  try {
    // check session
    let projectId = "";
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      // check api key
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

    const data = await req.json();
    const { name, description, type, evaluationCriteria, min, max, step } =
      data;

    if (!projectId) {
      projectId = data.projectId;
    }

    const test = await prisma.test.create({
      data: {
        name: name,
        description: description,
        projectId: projectId,
        type: type ?? "manual",
        evaluationCriteria: evaluationCriteria ?? "",
        min: min ?? -1,
        max: max ?? 1,
        step: step ?? 2,
      },
    });

    return NextResponse.json({
      data: test,
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const data = await req.json();
    const { id, name, description } = data;

    const test = await prisma.test.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({
      data: test,
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const data = await req.json();
    const { id } = data;

    await prisma.test.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
