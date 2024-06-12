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

    const traceService = new TraceService();
    const cost = await traceService.GetTokensCostPerHourPerProject(
      projectId,
      lastNHours,
      userId
    );
    const total = {
      total: cost.reduce(
        (acc: any, curr: { total: any }) => acc + curr.total,
        0
      ),
      input: cost.reduce(
        (acc: any, curr: { input: any }) => acc + curr.input,
        0
      ),
      output: cost.reduce(
        (acc: any, curr: { output: any }) => acc + curr.output,
        0
      ),
    };

    return NextResponse.json(
      {
        cost,
        ...total,
      },
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
