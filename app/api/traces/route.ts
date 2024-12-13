import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { hashApiKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const apiKey = req.headers.get("x-api-key");
    let { page, pageSize, projectId, filters, group, keyword } =
      await req.json();

    // check if user is logged in or has an api key
    if (!session || !session.user) {
      if (apiKey) {
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
          },
        });

        if (!project) {
          return NextResponse.json(
            { error: "No projects found" },
            { status: 404 }
          );
        }

        if (apiKey && project.apiKeyHash !== hashApiKey(apiKey)) {
          return NextResponse.json(
            { error: "Unauthorized. Invalid API key" },
            { status: 401 }
          );
        }

        if (pageSize > 100) {
          return NextResponse.json(
            { error: "Page size cannot be more than 100" },
            { status: 400 }
          );
        }

        // set defaults for API Access
        group = true; // always group by default
        filters = { filters: [], operation: "OR" }; // no filters by default
      } else {
        redirect("/login");
      }
    } else {
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
            message: "User does not have access to this project",
          },
          { status: 403 }
        );
      }
    }

    // get traces
    const traceService = new TraceService();
    const traces = await traceService.GetTracesInProjectPaginated(
      projectId,
      page,
      pageSize,
      filters,
      keyword
    );

    return NextResponse.json(
      {
        traces,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Something went wrong while fetching traces",
      },
      { status: 400 }
    );
  }
}
