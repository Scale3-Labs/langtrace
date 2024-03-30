import { User } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export default async function AppMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // if the path is the root path, redirect to login
  if (path === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = (await getToken({
    req,
  })) as {
    email?: string;
    user?: User;
  };
  if (session && path === "/login") {
    const userReq = await fetch(
      `${process.env.NEXT_PUBLIC_HOST}/api/user?email=${session?.email}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const response = await userReq.json();
    const user = response.data;
    if (user && !user.teamId) {
      // create a team
      await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "My Team",
          userId: user.id,
        }),
      });
    }

    // if there's a session
    return NextResponse.redirect(new URL("/projects", req.url));
  } else if (
    !session &&
    path !== "/login" &&
    path !== "/signup" &&
    path !== "/enterprise" &&
    path !== "/"
  ) {
    // if there's no session
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
