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

  const email = req.nextUrl.searchParams.get("email") as string;

  // get the user from the database and get the team from the user
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "user not found",
      },
      { status: 404 }
    );
  }

  // get the team from the user
  const team = await prisma.team.findFirst({
    where: {
      id: user.teamId as string,
    },
    include: {
      projects: true,
    },
  });

  if (!team) {
    return NextResponse.json(
      {
        message: "team not found",
      },
      { status: 404 }
    );
  }

  if (!team.projects) {
    return NextResponse.json(
      {
        message: "projects not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    projects: team.projects,
  });
}
