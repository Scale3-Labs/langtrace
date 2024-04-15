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

    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    if (!projectId) {
      return NextResponse.json(
        {
          message: "projectId not provided",
        },
        { status: 400 }
      );
    }

    const tests = await prisma.test.findMany({
      where: {
        projectId: projectId,
      },
    });

    if (!tests) {
      return NextResponse.json(
        {
          message: "No tests found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tests,
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { name, description, projectId } = data;

  const test = await prisma.test.create({
    data: {
      name: name,
      description: description,
      projectId: projectId,
    },
  });

  return NextResponse.json({
    data: test,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id, name, description } = data;

  const test = await prisma.test.update({
    where: {
      id,
    },
    data: {
      name,
      description,
    },
  });

  return NextResponse.json({
    data: test,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  await prisma.test.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
