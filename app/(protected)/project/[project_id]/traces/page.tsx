import Traces from "@/components/project/traces";
import CheckSession from "@/components/shared/check-session";
import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Langtrace | Traces",
  description: "View all traces for a project.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const user = session?.user;

  return (
    <>
      <CheckSession checkActiveSession={false} routeTo="/login" />
      <Traces email={user.email as string} />
    </>
  );
}
