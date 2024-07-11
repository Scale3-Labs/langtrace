import { authOptions } from "@/lib/auth/options";
import { TraceService } from "@/lib/services/trace_service";
import {
  authApiKey,
  normalizeData,
  normalizeOTELData,
  prepareForClickhouse,
} from "@/lib/utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // const text = await req.text();
  // console.log("Request Body:", text); // Log the request body for inspection

  // const data = JSON.parse(text);
  // console.log("Parsed Data:", data); // Log the parsed data
  // console.log("req", req);
  // const spans = data.resourceSpans?.[0]?.scopeSpans?.[0]?.spans;
  // console.log("Spans:", JSON.stringify(spans.attributes)); // Log the spans portion
  // normalizeOTELData(spans);

  try {
    const data = await req.json();
    const apiKey = req.headers.get("x-api-key");

    const response = await authApiKey(apiKey!);
    if (response.status !== 200) {
      return response;
    }

    // Get project data
    const projectData = await response.json();

    // Normalize and prepare data for Clickhouse
    let normalized = [];
    if (data.resourceSpans) {
      // coming from an OTEL exporter
      normalized = prepareForClickhouse(
        normalizeOTELData(data.resourceSpans?.[0]?.scopeSpans?.[0]?.spans)
      );
    } else {
      normalized = prepareForClickhouse(normalizeData(data));
    }
    const traceService = new TraceService();

    // Add traces to Clickhouse
    await traceService.AddSpans(normalized, projectData.data.project.id);
    return NextResponse.json(
      { message: "Traces added successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something went wrong while ingesting traces",
      },
      { status: 404 }
    );
  }
}

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
    const traceId = req.nextUrl.searchParams.get("traces") as string;
    const spanId = req.nextUrl.searchParams.get("spanId") as string;
    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    const getSpans = req.nextUrl.searchParams.get(
      "spans"
    ) as unknown as boolean;

    // pagination
    const page =
      (req.nextUrl.searchParams.get("page") as unknown as number) || 1;
    const pageSize =
      (req.nextUrl.searchParams.get("pageSize") as unknown as number) || 10;

    if (!projectId && !spanId && !traceId) {
      return NextResponse.json(
        { error: "Please provide a projectId or traceId or spanId" },
        { status: 400 }
      );
    }

    const traceService = new TraceService();
    if (spanId && projectId) {
      const span = await traceService.GetSpanById(spanId, projectId);
      return NextResponse.json(JSON.stringify(span), {
        status: 200,
      });
    }

    if (traceId && projectId) {
      const trace = await traceService.GetTraceById(traceId, projectId);
      return NextResponse.json(trace, {
        status: 200,
      });
    }

    if (projectId && getSpans) {
      const spans = await traceService.GetSpansInProjectPaginated(
        projectId,
        page,
        pageSize
      );
      return NextResponse.json(
        { spans },
        {
          status: 200,
        }
      );
    }

    if (projectId) {
      const traces = await traceService.GetTracesInProjectPaginated(
        projectId,
        page,
        pageSize
      );
      return NextResponse.json(
        { traces },
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
