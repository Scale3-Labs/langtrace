import { authOptions } from "@/lib/auth/options";
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
    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    console.log("projectId", projectId);

    if (!projectId) {
      return NextResponse.json(
        { error: "Please provide a projectId" },
        { status: 400 }
      );
    }

    const traceService = new TraceService();
    const userIDs = await traceService.GetUsersInProject(projectId);
    return NextResponse.json(
      { userIDs },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(JSON.stringify({ error }), {
      status: 400,
    });
  }
}
