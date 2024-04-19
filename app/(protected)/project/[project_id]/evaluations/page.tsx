import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Langtrace | Evaluations",
  description: "Evaluate the responses of the LLMs.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const user = session?.user;

  return (
    <>
      <PageClient email={user.email as string} />
    </>
  );
}
