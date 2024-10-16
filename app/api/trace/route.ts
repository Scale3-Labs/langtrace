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
import protobuf from "protobufjs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type");

    let data;
    if (contentType === "application/x-protobuf") {
      data = await decodeProtobuf(req);
    } else {
      data = await req.json();
    }

    const apiKey = req.headers.get("x-api-key");
    const userAgent = req.headers.get("user-agent");

    const response = await authApiKey(apiKey!);
    if (response.status !== 200) {
      return response;
    }

    // Get project data
    const projectData = await response.json();

    // Normalize and prepare data for Clickhouse
    let normalized = [];
    if (
      userAgent?.toLowerCase().includes("otel-otlp") ||
      userAgent?.toLowerCase().includes("opentelemetry")
    ) {
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

async function decodeProtobuf(req: NextRequest) {
  // Load the Protobuf schema
  const loadProtobuf = async () => {
    return protobuf.load(path.resolve("app/api/trace", "trace.proto"));
  };

  // Get raw data from the request body as ArrayBuffer
  const arrayBuffer = await req.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer); // Convert to Uint8Array

  // Load and decode the Protobuf schema
  const root = await loadProtobuf();

  const TracesData = root.lookupType("opentelemetry.proto.trace.v1.TracesData");

  // Decode the Protobuf binary data
  const decodedData = TracesData.decode(uint8Array);

  // Do something with decoded data (e.g., store in a database)

  const data = JSON.parse(JSON.stringify(decodedData, null, 2));
  return data;
}
