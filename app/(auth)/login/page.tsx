import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import LoginForm from "./form";

export default function LoginPage() {
  return (
    <div className="relative z-10 mt-[calc(30vh)] h-fit w-full max-w-md overflow-hidden border-y border-muted sm:rounded-2xl sm:border sm:shadow-xl">
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-muted bg-secondary px-4 py-6 pt-8 text-center sm:px-16">
        {/* <a href={process.env.NEXT_PUBLIC_HOST}>
          <Logo className="h-10 w-10" />
        </a> */}
        <h3 className="text-xl font-semibold">
          Sign in to {process.env.NEXT_PUBLIC_APP_NAME}
        </h3>
        <p className="text-sm text-muted-foreground">
          Open Source Observability for LLM applications
        </p>
      </div>
      <div className="flex flex-col space-y-3 bg-muted px-4 py-8 sm:px-16">
        <Suspense
          fallback={
            <>
              <Button disabled={true} />
              <div className="mx-auto h-5 w-3/4 rounded-lg bg-muted" />
            </>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
