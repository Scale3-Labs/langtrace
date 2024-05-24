import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { Data } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const id = req.nextUrl.searchParams.get("id") as string;
    const spanId = req.nextUrl.searchParams.get("spanId") as string;

    if (!id && !spanId) {
      return NextResponse.json(
        {
          error: "No data id or span id provided",
        },
        { status: 404 }
      );
    }

    if (id) {
      const result = await prisma.data.findFirst({
        where: {
          id,
        },
      });

      return NextResponse.json({
        data: result,
      });
    }

    if (spanId) {
      const result = await prisma.data.findMany({
        where: {
          spanId,
        },
      });

      return NextResponse.json({
        data: result,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const data = await req.json();
    const { datas, datasetId } = data;

    const result = await prisma.data.createMany({
      data: datas.map((data: Data) => ({
        input: data.input,
        output: data.output,
        note: data.note || "",
        spanId: data.spanId || "",
        datasetId,
      })),
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const data = await req.json();
    const { id, input, output, note } = data;

    const result = await prisma.data.update({
      where: {
        id,
      },
      data: {
        input,
        output,
        note,
      },
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }

    const data = await req.json();
    const { id } = data;

    await prisma.data.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
