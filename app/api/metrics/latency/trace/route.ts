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
    const userId =
      req.nextUrl.searchParams.get("userId") === "undefined"
        ? undefined
        : (req.nextUrl.searchParams.get("userId") as string);
    const model =
      req.nextUrl.searchParams.get("model") === "undefined"
        ? undefined
        : (req.nextUrl.searchParams.get("model") as string);
    const inference =
      req.nextUrl.searchParams.get("inference") === "undefined"
        ? "false"
        : (req.nextUrl.searchParams.get("inference") as string);
    const experimentId =
      req.nextUrl.searchParams.get("experimentId") === "undefined"
        ? undefined
        : (req.nextUrl.searchParams.get("experimentId") as string);

    if (!projectId) {
      return NextResponse.json(
        JSON.stringify({ message: "projectId is required" }),
        {
          status: 400,
        }
      );
    }

    const traceService = new TraceService();
    const totalTracesPerHour: any =
      await traceService.GetTotalTracePerHourPerProject(
        projectId,
        lastNHours,
        userId,
        experimentId,
        model,
        inference === "true"
      );
    const { averageLatencies, p99Latencies, p95Latencies } =
      await traceService.GetAverageTraceLatenciesPerHourPerProject(
        projectId,
        lastNHours,
        userId,
        model,
        inference === "true"
      );
    return NextResponse.json(
      {
        totalTracesPerHour,
        averageLatencies,
        p99Latencies,
        p95Latencies,
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
