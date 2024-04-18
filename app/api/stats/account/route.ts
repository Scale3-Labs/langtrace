import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  try {
    const email = req.nextUrl.searchParams.get("email") as string;

    // get the user from the database and get the team from the user and then get tenant from the team
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // get the team from the user
    const team = await prisma.team.findFirst({
      where: {
        id: user.teamId as string,
      },
      include: {
        projects: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          error: "No team found",
        },
        { status: 404 }
      );
    }

    const projects = team.projects;
    const projectIds = projects.map((project) => project.id);

    // calculate the total count of traces
    const traceService = new TraceService();

    const totalSpans = await traceService.GetTotalSpansPerAccount(projectIds);

    return NextResponse.json({
      totalSpans,
    });
  } catch (error) {
    return NextResponse.json(JSON.stringify({ error }), {
      status: 400,
    });
  }
}
