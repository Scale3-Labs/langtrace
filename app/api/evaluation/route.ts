import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { authApiKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== null) {
      const response = await authApiKey(apiKey);
      if (response.status !== 200) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const projectData = await response.json();
      const projectId = projectData.data.project.id;
      const data = await req.json();
      let { traceId, spanId, userScore, userId, reason, dataId } = data;

      const traceService = await new TraceService();

      // just gets the first span in the trace that has this type
      // can expand by having the SDK send an additional data point in the request specifying the llm type
      const correctSpan = await traceService.GetSpansWithAttribute(
        "langtrace.service.type",
        projectId,
        1,
        1,
        traceId
      );

      if (correctSpan.result.length > 0) {
        spanId = correctSpan.result[0].span_id;
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

      const payload: any = {
        spanId,
        traceId,
        projectId,
        userId,
        userScore,
        reason: reason || "",
        type: "llm", // users can only evaluate llm spans
        spanDate: new Date().toISOString(),
      };

      if (dataId) {
        payload["dataId"] = dataId;
      }

      const evaluation = await prisma.evaluation.create({
        data: payload,
      });
      return NextResponse.json({
        data: evaluation,
      });
    } else {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        ltUserScore,
        testId,
        reason,
        dataId,
        type,
        spanDate,
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

      const evaluationType = type || "llm";

      const payload: any = {
        spanId,
        traceId,
        spanDate,
        projectId,
        testId,
        ltUserId: user.id,
        ltUserScore,
        type: evaluationType,
        reason: reason || "",
      };

      if (dataId) {
        payload["dataId"] = dataId;
      }

      const evaluation = await prisma.evaluation.create({
        data: payload,
      });

      return NextResponse.json({
        data: evaluation,
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const apiKey = req.headers.get("x-api-key");
    let projectId = req.nextUrl.searchParams.get("projectId") as string;
    if ((!session || !session.user) && !apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (apiKey) {
      const response = await authApiKey(apiKey);
      if (response.status !== 200) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const projectData = await response.json();
      projectId = projectData.data.project.id;
    }

    const spanId = req.nextUrl.searchParams.get("spanId") as string;
    const testId = req.nextUrl.searchParams.get("testId") as string;
    const includeTest = req.nextUrl.searchParams.get("includeTest") === "true";
    const type = req.nextUrl.searchParams.get("type") as string;

    if (!projectId && !spanId) {
      return NextResponse.json(
        {
          message: "Please provide a projectId or spanId",
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

    const whereClause: any = {
      projectId,
    };

    if (spanId) {
      whereClause.spanId = spanId;
    }

    if (testId) {
      whereClause.testId = testId;
    }

    if (type) {
      whereClause.type = type;
    }

    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        Test: includeTest,
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
  try {
    const session = await getServerSession(authOptions);
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== null) {
      const response = await authApiKey(apiKey);
      if (response.status !== 200) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const projectData = await response.json();
      const projectId = projectData.data.project.id;

      let { spanId, userScore, userId } = await req.json().catch(() => ({}));
      if (!spanId || !userScore || !userId) {
        return NextResponse.json(
          {
            error:
              "spanId, userId and userScore are required in the request body",
          },
          { status: 400 }
        );
      }
      userScore = Number(userScore);
      if (Number.isNaN(userScore)) {
        return NextResponse.json(
          { error: "userScore must be a number" },
          { status: 400 }
        );
      }
      if (userScore !== 1 && userScore !== -1) {
        return NextResponse.json(
          { error: "userScore must be 1 or -1" },
          { status: 400 }
        );
      }
      if (userId?.length === 0) {
        return NextResponse.json(
          { error: "userId must be a non-empty string" },
          { status: 400 }
        );
      }

      const traceService = await new TraceService();
      const tempSpanId = await traceService.GetSpanById(spanId, projectId);
      const correctSpan = await traceService.GetSpansWithAttribute(
        "langtrace.service.type",
        projectId,
        1,
        1,
        tempSpanId.trace_id
      );

      if (correctSpan.result.length > 0) {
        spanId = correctSpan.result[0].span_id;
      }

      const evaluation = await prisma.evaluation.findFirst({
        where: {
          projectId,
          spanId,
          testId: null,
        },
      });
      if (!evaluation) {
        return NextResponse.json(
          { error: "Evaluation not found" },
          { status: 404 }
        );
      }
      const updatedEvaluation = await prisma.evaluation.update({
        where: {
          id: evaluation.id,
        },
        data: {
          userScore,
          userId,
        },
      });
      return NextResponse.json({ data: updatedEvaluation });
    } else {
      if (!session || !session.user) {
        NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        id,
        spanId,
        traceId,
        spanDate,
        ltUserScore,
        testId,
        type,
        reason,
      } = data;
      const evaluation = await prisma.evaluation.update({
        where: {
          id,
        },
        data: {
          spanId,
          traceId,
          spanDate,
          ltUserId: user.id,
          ltUserScore,
          testId,
          type,
          reason: reason || "",
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
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
