import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Annotations from "./annotations";

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

  return <Annotations email={user.email as string} />;
}
