import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PromptManagement from "./prompt-management";

export const metadata: Metadata = {
  title: "Langtrace | Prompts",
  description: "Manage all your prompts in one place.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const email = session?.user?.email as string;

  return (
    <>
      <PromptManagement email={email} />
    </>
  );
}
