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

  const team = await prisma.team.findUnique({
    where: {
      id,
    },
    include: {
      users: true,
    },
  });

  if (!team) {
    return NextResponse.json(
      {
        error: "Team not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: team,
  });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, userId } = data;

  // check if the user exists
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        error: "User not found",
      },
      { status: 404 }
    );
  }

  // create a new team
  const team = await prisma.team.create({
    data: {
      name,
    },
  });

  // update the user with the teamId
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      teamId: team.id,
    },
  });

  // return the repository
  return NextResponse.json({
    data: team,
  });
}

export async function PUT(req: NextRequest) {
  const data = await req.json();
  const { id, name } = data;

  const team = await prisma.team.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });

  return NextResponse.json({
    data: team,
  });
}
