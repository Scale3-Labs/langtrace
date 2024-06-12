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
    const model = req.nextUrl.searchParams.get("model") || "";

    if (!projectId) {
      return NextResponse.json(
        JSON.stringify({ message: "Project ID not provided" }),
        {
          status: 400,
        }
      );
    }
    console.log(model);
    const traceService = new TraceService();
    const usage = await traceService.GetTokensUsedPerHourPerProject(
      projectId,
      lastNHours,
      userId,
      model
    );
    const total = {
      totalTokens: usage.reduce(
        (acc: any, curr: { totalTokens: any }) => acc + curr.totalTokens,
        0
      ),
      inputTokens: usage.reduce(
        (acc: any, curr: { inputTokens: any }) => acc + curr.inputTokens,
        0
      ),
      outputTokens: usage.reduce(
        (acc: any, curr: { outputTokens: any }) => acc + curr.outputTokens,
        0
      ),
    };
    console.log(usage);
    return NextResponse.json(
      {
        usage,
        ...total,
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
