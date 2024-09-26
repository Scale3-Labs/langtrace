"use client";

import React, { useEffect, useState } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Session } from "next-auth";

interface CustomPostHogProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function CustomPostHogProvider({
  children,
  session,
}: CustomPostHogProviderProps) {
  const [telemetryEnabled, setTelemetryEnabled] = useState<boolean>(false);

  useEffect(() => {
    async function initializePostHog() {
      const enabled = process.env.TELEMETRY_ENABLED === "true";
      setTelemetryEnabled(enabled);

      if (enabled && typeof window !== "undefined") {
        posthog.init(process.env.POSTHOG_API_KEY!, {
          api_host: "https://app.posthog.com",
          loaded: (posthog) => {
            if (process.env.NODE_ENV === "development") posthog.debug();
          },
        });
      }
    }

    initializePostHog();
  }, [session]);

  if (!telemetryEnabled) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
