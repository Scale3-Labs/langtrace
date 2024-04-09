import { authOptions } from "@/lib/auth/options";
import { TraceService } from "@/lib/services/trace_service";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      redirect("/login");
    }

    const { page, pageSize, projectId, filters } = await req.json();
    const traceService = new TraceService();
    const traces = await traceService.GetTracesInProjectPaginated(
      projectId,
      page,
      pageSize,
      filters
    );

    return NextResponse.json(
      {
        traces,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something went wrong while fetching traces",
      },
      { status: 400 }
    );
  }
}
