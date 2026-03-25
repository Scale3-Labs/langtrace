import { describe, it, expect } from "vitest";

// Integration tests for MiniMax provider
// These tests verify the end-to-end integration of MiniMax components

describe("MiniMax Integration - Provider Registration", () => {
  it("should have MiniMax registered in all required constants", async () => {
    const { LLM_VENDORS, LLM_VENDOR_APIS, SUPPORTED_VENDORS, MINIMAX_PRICING } =
      await import("../../lib/constants");

    // Verify consistent registration across all provider lists
    const vendorEntry = LLM_VENDORS.find((v) => v.value === "minimax");
    const apiEntry = LLM_VENDOR_APIS.find(
      (v) => v.value === "MINIMAX_API_KEY"
    );

    expect(vendorEntry).toBeDefined();
    expect(apiEntry).toBeDefined();
    expect(SUPPORTED_VENDORS.MINIMAX).toBe("MiniMax");
    expect(Object.keys(MINIMAX_PRICING).length).toBeGreaterThan(0);
  });

  it("should have matching models between types and pricing", async () => {
    const { MINIMAX_PRICING } = await import("../../lib/constants");
    const { minimaxModels } = await import(
      "../../lib/types/playground_types"
    );

    // Every model in the dropdown should have pricing
    for (const model of minimaxModels) {
      expect(
        MINIMAX_PRICING[model.value],
        `Missing pricing for model: ${model.value}`
      ).toBeDefined();
    }
  });

  it("should have chat handler aligned with API route", async () => {
    const handlers = await import(
      "../../components/playground/chat-handlers"
    );

    // Verify the handler exists and is a function
    expect(typeof handlers.minimaxHandler).toBe("function");

    // The handler should accept two parameters (llm config and api key)
    expect(handlers.minimaxHandler.length).toBe(2);
  });
});

describe("MiniMax Integration - API Route File", () => {
  it("should have MiniMax API route at correct path", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      __dirname,
      "../../app/api/chat/minimax/route.ts"
    );
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should configure OpenAI client with MiniMax base URL", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      __dirname,
      "../../app/api/chat/minimax/route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    expect(content).toContain("https://api.minimax.io/v1");
    expect(content).toContain("new OpenAI");
  });

  it("should implement temperature clamping in route", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      __dirname,
      "../../app/api/chat/minimax/route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    expect(content).toContain("Math.min(Math.max(data.temperature, 0), 1)");
  });

  it("should support streaming via OpenAIStream", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      __dirname,
      "../../app/api/chat/minimax/route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    expect(content).toContain("OpenAIStream");
    expect(content).toContain("StreamingTextResponse");
  });

  it("should follow same pattern as perplexity route", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const minimaxPath = path.resolve(
      __dirname,
      "../../app/api/chat/minimax/route.ts"
    );
    const perplexityPath = path.resolve(
      __dirname,
      "../../app/api/chat/perplexity/route.ts"
    );
    const minimaxContent = fs.readFileSync(minimaxPath, "utf-8");
    const perplexityContent = fs.readFileSync(perplexityPath, "utf-8");

    // Both should use OpenAI client, OpenAIStream, StreamingTextResponse
    expect(minimaxContent).toContain("import OpenAI from");
    expect(perplexityContent).toContain("import OpenAI from");
    expect(minimaxContent).toContain("OpenAIStream");
    expect(perplexityContent).toContain("OpenAIStream");
  });
});

describe("MiniMax Integration - Vendor Metadata", () => {
  it("should have vendor badge color for minimax", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const vendorPath = path.resolve(
      __dirname,
      "../../components/shared/vendor-metadata.tsx"
    );
    const content = fs.readFileSync(vendorPath, "utf-8");

    expect(content).toContain('vendor.includes("minimax")');
  });

  it("should have vendor color for minimax", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const vendorPath = path.resolve(
      __dirname,
      "../../components/shared/vendor-metadata.tsx"
    );
    const content = fs.readFileSync(vendorPath, "utf-8");

    // Should appear in both vendorBadgeColor and vendorColor
    const matches = content.match(/minimax/g);
    expect(matches).toBeDefined();
    expect(matches!.length).toBeGreaterThanOrEqual(3); // badge, color, and logo
  });
});
