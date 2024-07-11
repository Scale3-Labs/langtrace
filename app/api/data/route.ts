import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { authApiKey } from "@/lib/utils";
import { Data } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const id = req.nextUrl.searchParams.get("id") as string;
    const spanId = req.nextUrl.searchParams.get("spanId") as string;

    if (!id && !spanId) {
      return NextResponse.json(
        {
          error: "No data id or span id provided",
        },
        { status: 404 }
      );
    }

    if (id) {
      const result = await prisma.data.findFirst({
        where: {
          id,
        },
      });

      return NextResponse.json({
        data: result,
      });
    }

    if (spanId) {
      const result = await prisma.data.findMany({
        where: {
          spanId,
        },
      });

      return NextResponse.json({
        data: result,
      });
    }
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
    const { datas, datasetId, runId } = data;
    if (!projectId) {
      projectId = data.projectId;
    }

    const payload = datas.map((data: Data) => {
      const d: any = {
        input: data.input,
        output: data.output,
        contexts: data.contexts || [],
        annotatedOutput: data.annotatedOutput || "",
        note: data.note || "",
        spanId: data.spanId || "",
        projectId: projectId || "",
        datasetId: datasetId || "",
      };

      if (runId) {
        d.runId = runId;
      }
      return d;
    });

    const result = await prisma.data.createMany({
      data: payload,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.log(error);
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
    const { id, input, output, annotatedOutput, contexts, note } = data;

    const result = await prisma.data.update({
      where: {
        id,
      },
      data: {
        input,
        output,
        annotatedOutput,
        contexts,
        note,
      },
    });

    return NextResponse.json({
      data: result,
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

    await prisma.data.delete({
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
