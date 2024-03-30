"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next");
  const [clickedGoogle, setClickedGoogle] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          setClickedGoogle(true);
          signIn("google", {
            ...(next && next.length > 0 ? { callbackUrl: next } : {}),
          });
        }}
        disabled={clickedGoogle}
        className="flex items-center gap-2"
      >
        <Image
          src="/google.svg"
          alt="Google logo"
          width={24}
          height={24}
          className="rounded-full"
        />
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          Sign in
        </Link>
        .
      </p>
    </>
  );
}
