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
        message: "project id not provided",
      },
      { status: 400 }
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
    },
  });

  if (!project) {
    return NextResponse.json(
      {
        message: "No projects found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    project: project,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { name, description, teamId } = data;

  const project = await prisma.project.create({
    data: {
      name: name,
      description: description,
      teamId: teamId,
    },
  });

  return NextResponse.json({
    data: project,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id, name, description, teamId, apiKeyHash } = data;

  const project = await prisma.project.update({
    where: {
      id,
    },
    data: {
      name,
      description,
      apiKeyHash: apiKeyHash,
      teamId,
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
