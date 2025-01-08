import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Experiments from "./page-client";

export const metadata: Metadata = {
  title: "Langtrace | Experiments",
  description: "View and manage all your experiments in one place.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  return <Experiments />;
}
