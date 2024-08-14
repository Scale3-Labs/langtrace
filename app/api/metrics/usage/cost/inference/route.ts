import { authOptions } from "@/lib/auth/options";
import { TraceService } from "@/lib/services/trace_service";
import { calculatePriceFromUsage } from "@/lib/utils";
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
    const cost = await traceService.GetInferenceCostPerProject(projectId);
    const inferenceCount = await traceService.GetTotalTracesPerProject(
      projectId,
      true
    );

    if (cost === 0 || inferenceCount === 0) {
      return NextResponse.json(
        {
          cost: 0,
          count: 0,
        },
        {
          status: 200,
        }
      );
    }

    let totalCost = 0;

    cost.forEach(
      (item: {
        input_tokens: string;
        output_tokens: string;
        vendor: string;
        model: string;
      }) => {
        const usage = {
          input_tokens: parseInt(item.input_tokens),
          output_tokens: parseInt(item.output_tokens),
        };

        const price = calculatePriceFromUsage(
          item.vendor.toLowerCase(),
          item.model,
          usage
        );

        totalCost += price.total;
      }
    );

    return NextResponse.json(
      {
        cost: totalCost,
        count: inferenceCount,
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
