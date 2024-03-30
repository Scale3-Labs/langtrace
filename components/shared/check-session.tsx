import { authOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function CheckSession({
  routeTo,
  checkActiveSession = true,
}: {
  routeTo: string;
  checkActiveSession?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (checkActiveSession && session?.user) {
    redirect(routeTo);
  } else if (!checkActiveSession && !session) {
    redirect(routeTo);
  }
  return <></>;
}
