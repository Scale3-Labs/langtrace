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

  const userReq = await fetch(
    `${process.env.NEXT_PUBLIC_HOST}/api/user?email=${session?.email}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  let userExists = true;
  if (userReq.status === 404) {
    userExists = false;
  }

  if (session && userExists && (path === "/login" || path === "/signup")) {
    const response = await userReq.json();
    const user = response.data;
    if (user) {
      let teamName: string | undefined;
      if (!user.teamId) {
        // create a team
        const team = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/team`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "My Team",
            userId: user.id,
            role: "owner",
            status: "active",
          }),
        }).then((res) => res.json());
        teamName = team?.data?.name;
      }
    }

    // if there's a session
    return NextResponse.redirect(new URL("/projects", req.url));
  } else if (
    session &&
    !userExists &&
    path !== "/signup" &&
    path !== "/login"
  ) {
    return NextResponse.redirect(new URL("/signup", req.url));
  } else if (
    !session &&
    path !== "/login" &&
    path !== "/signup" &&
    path !== "/"
  ) {
    // if there's no session
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
