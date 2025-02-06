import prisma from "@/lib/prisma";
import { TraceService } from "@/lib/services/trace_service";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (process.env.CRON_API_KEY !== undefined) {
    const apiKey = req.headers.get("cron-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Unauthorized. Missing API key" },
        {
          status: 401,
        }
      );
    }

    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid API key" },
        {
          status: 401,
        }
      );
    }
  }

  const traceService = new TraceService();
  try {
    // Fetch all enabled retention policies
    const policies = await prisma.projectRetentionPolicy.findMany({
      where: { enabled: true },
    });

    for (const policy of policies) {
      await traceService.DeleteTracesOlderThanXDays(
        policy.projectId,
        policy.retentionDays
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting old traces:', error);
  }
}