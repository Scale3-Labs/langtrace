import Traces from "@/components/project/traces/traces";
import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Langtrace | Traces",
  description: "View all traces for a project.",
};

interface PageProps {
  params: {
    project_id: string;
  };
}

export default async function Page({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  return <Traces project_id={params.project_id} />;
}
