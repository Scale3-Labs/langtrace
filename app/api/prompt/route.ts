import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const id = req.nextUrl.searchParams.get("id") as string;

  if (!id) {
    return NextResponse.json(
      {
        error: "No prompt id provided",
      },
      { status: 404 }
    );
  }

  const result = await prisma.prompt.findFirst({
    where: {
      id,
    },
  });

  return NextResponse.json({
    data: result,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const {
    value,
    variables,
    model,
    modelSettings,
    version,
    live,
    note,
    promptsetId,
  } = data;
  const dataToAdd: any = {
    value,
    variables,
    model,
    modelSettings,
    version,
    live,
    note,
    promptsetId,
  };

  if (data.spanId) {
    dataToAdd.spanId = data.spanId;
  }

  if (live) {
    const existingLivePrompt = await prisma.prompt.findFirst({
      where: {
        live: true,
      },
    });

    if (existingLivePrompt) {
      await prisma.prompt.update({
        where: {
          id: existingLivePrompt.id,
        },
        data: {
          live: false,
        },
      });
    }
  }

  const result = await prisma.prompt.create({
    data: dataToAdd,
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
  const {
    id,
    value,
    variables,
    model,
    modelSettings,
    version,
    live,
    note,
    promptsetId,
  } = data;
  const dataToUpdate: any = {
    value,
    variables,
    model,
    modelSettings,
    version,
    live,
    note,
    promptsetId,
  };

  if (data.spanId) {
    dataToUpdate.spanId = data.spanId;
  }

  const result = await prisma.prompt.update({
    where: {
      id,
    },
    data: dataToUpdate,
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

  const prompt = await prisma.prompt.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
