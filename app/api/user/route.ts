import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  let email: string = req.nextUrl.searchParams.get("email") as string;
  if (!email) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      redirect("/login");
    }
    email = session?.user?.email as string;
    if (!email) {
      return NextResponse.json(
        {
          error: "email not found",
        },
        { status: 404 }
      );
    }
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      Team: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "user not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: user,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id, name, teamId, role, status } = data;

  if ("teamId" in data) {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        teamId,
      },
    });
    return NextResponse.json({
      data: user,
    });
  }

  if ("role" in data) {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        role,
      },
    });
    return NextResponse.json({
      data: user,
    });
  }

  if ("status" in data) {
    console.log("updating status");
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
    return NextResponse.json({
      data: user,
    });
  }

  const user = await prisma.user.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });

  return NextResponse.json({
    data: user,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { email, name, team_id, status, role } = data;

  const user = await prisma.user.create({
    data: {
      email,
      name,
      teamId: team_id,
      status,
      role,
    },
  });

  return NextResponse.json({
    data: user,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  const user = await prisma.user.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
