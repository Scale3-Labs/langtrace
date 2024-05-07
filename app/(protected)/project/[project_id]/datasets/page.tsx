import DataSet from "@/components/project/dataset/data-set";
import { authOptions } from "@/lib/auth/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Langtrace | Dataset",
  description: "See your datasets and prompt sets.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const user = session?.user;

  return (
    <>
      <DataSet email={user.email as string} />
    </>
  );
}
