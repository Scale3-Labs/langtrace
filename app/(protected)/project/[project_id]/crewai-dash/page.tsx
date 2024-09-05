import AgentCrewsDashboard from "@/components/project/agent-crews/dashboard";
import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Langtrace | Agent Crews",
  description: "View all the agent crews from CrewAI.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const user = session?.user;

  return (
    <>
      <AgentCrewsDashboard email={user.email as string} />
    </>
  );
}
