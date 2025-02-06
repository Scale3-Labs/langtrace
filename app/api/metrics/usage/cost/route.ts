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

    const traceService = new TraceService();
    const cost = await traceService.GetTokensCostPerHourPerProject(
      projectId,
      lastNHours,
      userId,
      model
    );

    // aggregate cost by date
    const costPerDate: any = [];
    for (const c of cost) {
      const date = c.date;
      const existing = costPerDate.find((d: any) => d.date === date);
      if (existing) {
        existing.total += c.total;
        existing.input += c.input;
        existing.output += c.output;
        existing.cached_input += c.cached_input;
      } else {
        costPerDate.push({
          date,
          total: c.total,
          input: c.input,
          output: c.output,
          cached_input: c.cached_input,
        });
      }
    }

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
      cached_input: cost.reduce(
        (acc: any, curr: { cached_input: any }) => acc + curr.cached_input,
        0
      ),
    };

    return NextResponse.json(
      {
        cost: costPerDate,
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
