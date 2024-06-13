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
    const lastNHours = parseInt(
      req.nextUrl.searchParams.get("lastNHours") || "168"
    );
    const userId = req.nextUrl.searchParams.get("userId") || "";
    if (!projectId) {
      return NextResponse.json(
        JSON.stringify({ message: "projectId is required" }),
        {
          status: 400,
        }
      );
    }

    const traceService = new TraceService();
    const spans: any = await traceService.GetTotalSpansPerHourPerProject(
      projectId,
      lastNHours,
      userId
    );
    const total = spans.reduce(
      (acc: number, curr: { spanCount: string }) =>
        acc + Number(curr.spanCount),
      0
    );
    return NextResponse.json(
      {
        spans,
        total,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(JSON.stringify({ message: error }), {
      status: 400,
    });
  }
}
