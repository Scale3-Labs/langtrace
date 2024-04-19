import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const email = session?.user?.email as string;
  if (!email) {
    return NextResponse.json(
      {
        error: "email not found",
      },
      { status: 404 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      Team: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "user not found",
      },
      { status: 404 }
    );
  }

  const data = await req.json();
  const {
    traceId,
    spanId,
    projectId,
    model,
    score,
    spanStartTime,
    prompt,
    testId,
  } = data;

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
        error: "User does not have access to this project",
      },
      { status: 403 }
    );
  }

  // check if an evaluation already exists for the spanId
  const existingEvaluation = await prisma.evaluation.findFirst({
    where: {
      spanId,
    },
  });

  if (existingEvaluation) {
    return NextResponse.json(
      {
        error: "Evaluation already exists for this span",
      },
      { status: 400 }
    );
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      spanStartTime,
      spanId,
      traceId,
      userId: user.id,
      projectId,
      model,
      score,
      prompt,
      testId,
    },
  });

  return NextResponse.json({
    data: evaluation,
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    const spanId = req.nextUrl.searchParams.get("spanId") as string;
    const prompt = req.nextUrl.searchParams.get("prompt") as string;

    if (!projectId && !spanId && !prompt) {
      return NextResponse.json(
        {
          message: "Please provide a projectId or spanId or prompt",
        },
        { status: 400 }
      );
    }

    if (spanId) {
      const evaluations = await prisma.evaluation.findFirst({
        where: {
          spanId,
        },
      });

      if (!evaluations) {
        return NextResponse.json({
          evaluations: [],
        });
      }

      return NextResponse.json({
        evaluations: [evaluations],
      });
    }

    if (prompt) {
      const evaluations = await prisma.evaluation.findMany({
        where: {
          prompt,
        },
      });

      if (!evaluations) {
        return NextResponse.json({
          evaluations: [],
        });
      }

      return NextResponse.json({
        evaluations: [evaluations],
      });
    }

    // check if this user has access to this project
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

    const evaluations = await prisma.evaluation.findMany({
      where: {
        projectId,
      },
    });

    if (!evaluations) {
      return NextResponse.json({ evalutions: [] }, { status: 200 });
    }

    return NextResponse.json({
      evaluations,
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const email = session?.user?.email as string;
  if (!email) {
    return NextResponse.json(
      {
        error: "email not found",
      },
      { status: 404 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      Team: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "user not found",
      },
      { status: 404 }
    );
  }

  const data = await req.json();
  const { id, score } = data;

  const evaluation = await prisma.evaluation.update({
    where: {
      id,
    },
    data: {
      userId: user.id,
      score,
    },
  });

  if (!evaluation) {
    return NextResponse.json(
      {
        error: "No evaluation found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: evaluation,
  });
}
