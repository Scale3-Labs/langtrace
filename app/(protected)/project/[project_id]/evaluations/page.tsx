import Parent from "@/components/project/eval/parent";
import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Langtrace | Eval",
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
      <Parent email={user.email as string} />
    </>
  );
}
