import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PageClient from "./page-client";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const email = session?.user?.email as string;

  const resp = await fetch(
    `${process.env.NEXTAUTH_URL_INTERNAL}/api/user?email=${email}`
  );
  const user = await resp.json();

  return (
    <>
      <PageClient user={user.data} />
    </>
  );
}
