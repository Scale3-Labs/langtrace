import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Langtrace | Projects",
  description: "See all your projects in one place.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const email = session?.user?.email as string;

  return <PageClient email={email} />;
}
