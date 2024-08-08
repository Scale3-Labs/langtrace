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

    const traceService = new TraceService();
    const cost = await traceService.GetAvgInferenceCostPerProject(projectId);

    // aggregate cost by date
    // const costPerDate: any = [];
    // for (const c of cost) {
    //   const date = c.date;
    //   const existing = costPerDate.find((d: any) => d.date === date);
    //   if (existing) {
    //     existing.total += c.total;
    //     existing.input += c.input;
    //     existing.output += c.output;
    //   } else {
    //     costPerDate.push({
    //       date,
    //       total: c.total,
    //       input: c.input,
    //       output: c.output,
    //     });
    //   }
    // }

    // const total = {
    //   total: cost.reduce(
    //     (acc: any, curr: { total: any }) => acc + curr.total,
    //     0
    //   ),
    //   input: cost.reduce(
    //     (acc: any, curr: { input: any }) => acc + curr.input,
    //     0
    //   ),
    //   output: cost.reduce(
    //     (acc: any, curr: { output: any }) => acc + curr.output,
    //     0
    //   ),
    // };

    return NextResponse.json(
      {
        cost: 0,
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
