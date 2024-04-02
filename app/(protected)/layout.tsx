import { Header } from "@/components/shared/header";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen w-full">
        <Header email={session?.user?.email as string} />
        <Separator />
        {children}
      </main>
    </Suspense>
  );
}
