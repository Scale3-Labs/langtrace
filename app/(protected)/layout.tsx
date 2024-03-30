import { Header } from "@/components/shared/header";
import { Separator } from "@/components/ui/separator";
import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
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

  const user = await prisma.user.findUnique({
    where: {
      email: session?.user?.email as string,
    },
  });

  // if user is not found, redirect to login
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen w-full">
        <Header
          name={user.name as string}
          email={user.email as string}
          avatar={user.image as string}
        />
        <Separator />
        {children}
      </main>
    </Suspense>
  );
}
