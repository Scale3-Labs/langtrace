import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ca } from "date-fns/locale";


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const project_id = req.nextUrl.searchParams.get("project_id") as string;

  try {
    const projectRetentionPolicy = await prisma.projectRetentionPolicy.findFirst({
      where: {
        projectId: project_id,
      },
    });
  
    return NextResponse.json({
      data: projectRetentionPolicy,
    });
  } catch (error) {
    return NextResponse.json({
      error: `An error occurred while performing this action: ${error}`
    });
  }
}


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { project_id, enabled, retention_days } = data;

  const projectRetentionPolicy = await prisma.projectRetentionPolicy.upsert({
    where: {
      projectId: project_id,
    },
    update: {
      enabled,
      retentionDays: retention_days,
      updatedAt: new Date(),
    },
    create: {
      projectId: project_id as string,
      enabled: enabled as boolean,
      retentionDays: retention_days as number,
      createdAt: new Date(),
    }
  });

  return NextResponse.json({
    data: projectRetentionPolicy,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const project_id = req.nextUrl.searchParams.get("project_id") as string;

  if (!project_id) {
    return NextResponse.json({
      error: "Please provide a project_id",
    });
  }

  try {
    const projectRetentionPolicy = await prisma.projectRetentionPolicy.delete({
      where: {
        projectId: project_id,
      },
    });
    return NextResponse.json({
      data: projectRetentionPolicy,
    });
  } catch (error) {
    return NextResponse.json({
      error: `An error occurred while performing this action: ${error}`,
    });
  }
}