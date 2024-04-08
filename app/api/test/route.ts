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

  const projectId = req.nextUrl.searchParams.get("projectId") as string;

  const tests = await prisma.test.findMany({
    where: {
      projectId: projectId,
    },
  });

  if (!tests) {
    return NextResponse.json(
      {
        error: "No tests found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    tests,
  });
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

  const project = await prisma.project.update({
    where: {
      id,
    },
    data: {
      name,
      description,
    },
  });

  return NextResponse.json({
    data: project,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  const project = await prisma.project.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    data: project,
  });
}
