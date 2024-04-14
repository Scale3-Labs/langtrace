import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
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
    if (!spanId && !id) {
      return NextResponse.json(
        {
          message: "No span id or prompt id provided",
        },
        { status: 404 }
      );
    }

    if (id) {
      const result = await prisma.prompt.findFirst({
        where: {
          id,
        },
      });

      return NextResponse.json({
        data: result,
      });
    }

    if (spanId) {
      const result = await prisma.prompt.findMany({
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { datas, promptsetId } = data;

  const result = await prisma.prompt.createMany({
    data: datas.map((data: any) => {
      return {
        value: data.value,
        note: data.note || "",
        spanId: data.spanId || "",
        promptsetId,
      };
    }),
  });

  return NextResponse.json({
    data: result,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id, value, note } = data;

  const result = await prisma.prompt.update({
    where: {
      id,
    },
    data: {
      value,
      note,
    },
  });

  return NextResponse.json({
    data: result,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  const result = await prisma.prompt.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
