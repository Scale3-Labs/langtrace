import { User } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export default async function AppMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip middleware for API routes and static files
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

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

  // If no session and trying to access protected routes, redirect to login
  if (!session && path !== "/login" && path !== "/signup" && path !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Only check user existence for specific paths where it's needed
  if (
    session?.email &&
    (path === "/login" || path === "/signup" || path === "/projects")
  ) {
    const userReq = await fetch(
      `${process.env.NEXT_PUBLIC_HOST}/api/user?email=${session.email}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "force-cache", // Use caching for this request
      }
    );

    const userExists = userReq.status !== 404;

    if (userExists && (path === "/login" || path === "/signup")) {
      return NextResponse.redirect(new URL("/projects", req.url));
    } else if (!userExists && path !== "/signup" && path !== "/login") {
      return NextResponse.redirect(new URL("/signup", req.url));
    }
  }

  return NextResponse.next();
}
