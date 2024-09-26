import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY!, {
      host: process.env.POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function captureEvent(
  distinctId: string,
  eventName: string,
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    if (process.env.TELEMETRY_ENABLED !== "false") {
      const client = getPostHogClient();
      await client.capture({
        distinctId,
        event: eventName,
        properties: {
          ...properties,
          is_self_hosted: true,
        },
      });
      await client.shutdown();
    }
  } catch (error) {
    console.error("Error capturing telemetry events:", error);
  }
}
