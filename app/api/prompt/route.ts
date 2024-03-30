import { authOptions } from "@/lib/auth/options";
import { TraceService } from "@/lib/services/trace_service";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

//curl "http://localhost:3000/api/trace?projectId=dylan_test_table&traceId=15132931e76a38ffcff2707b38e75e20"
// example curl for getting specific trace from a project

// curl "http://localhost:3000/api/trace?projectId=dylan_test_table&attribute=llm.model"
// example curl for getting traces with specific attribute from a project

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    const page = (req.nextUrl.searchParams.get("page") as unknown as number) || 1;
    const pageSize = (req.nextUrl.searchParams.get("pageSize") as unknown as number) || 10;

    if (!projectId) {
      return NextResponse.json(
        { error: "Please provide a projectId or spanId" },
        { status: 400 }
      );
    }

    const traceService = new TraceService();

    if (projectId) {
      const prompts = await traceService.GetSpansWithAttribute(
        "llm.prompts",
        projectId, 
        page, 
        pageSize
      );
      return NextResponse.json(
        { prompts },
        {
          status: 200,
        }
      );
    }
  } catch (error) {
    return NextResponse.json(JSON.stringify({ error }), {
      status: 400,
    });
  }
}
