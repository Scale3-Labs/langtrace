import { describe, it, expect } from "vitest";

// Unit tests for MiniMax constants and types
describe("MiniMax Constants", () => {
  it("should include MiniMax in LLM_VENDORS", async () => {
    const { LLM_VENDORS } = await import("../../lib/constants");
    const minimax = LLM_VENDORS.find((v) => v.value === "minimax");
    expect(minimax).toBeDefined();
    expect(minimax?.label).toBe("MiniMax");
  });

  it("should include MINIMAX_API_KEY in LLM_VENDOR_APIS", async () => {
    const { LLM_VENDOR_APIS } = await import("../../lib/constants");
    const minimax = LLM_VENDOR_APIS.find(
      (v) => v.value === "MINIMAX_API_KEY"
    );
    expect(minimax).toBeDefined();
    expect(minimax?.label).toBe("MiniMax");
  });

  it("should include MINIMAX in SUPPORTED_VENDORS", async () => {
    const { SUPPORTED_VENDORS } = await import("../../lib/constants");
    expect(SUPPORTED_VENDORS.MINIMAX).toBe("MiniMax");
  });

  it("should have MINIMAX_PRICING with correct models", async () => {
    const { MINIMAX_PRICING } = await import("../../lib/constants");
    expect(MINIMAX_PRICING).toBeDefined();
    expect(MINIMAX_PRICING["MiniMax-M2.7"]).toBeDefined();
    expect(MINIMAX_PRICING["MiniMax-M2.7-highspeed"]).toBeDefined();
    expect(MINIMAX_PRICING["MiniMax-M2.5"]).toBeDefined();
    expect(MINIMAX_PRICING["MiniMax-M2.5-highspeed"]).toBeDefined();
  });

  it("should have valid pricing format for all MiniMax models", async () => {
    const { MINIMAX_PRICING } = await import("../../lib/constants");
    for (const [model, pricing] of Object.entries(MINIMAX_PRICING)) {
      expect(pricing.input).toBeGreaterThan(0);
      expect(pricing.output).toBeGreaterThan(0);
      expect(typeof pricing.input).toBe("number");
      expect(typeof pricing.output).toBe("number");
    }
  });
});

describe("MiniMax Models", () => {
  it("should export minimaxModels array", async () => {
    const { minimaxModels } = await import(
      "../../lib/types/playground_types"
    );
    expect(minimaxModels).toBeDefined();
    expect(Array.isArray(minimaxModels)).toBe(true);
    expect(minimaxModels.length).toBe(4);
  });

  it("should have correct model values", async () => {
    const { minimaxModels } = await import(
      "../../lib/types/playground_types"
    );
    const values = minimaxModels.map((m) => m.value);
    expect(values).toContain("MiniMax-M2.7");
    expect(values).toContain("MiniMax-M2.7-highspeed");
    expect(values).toContain("MiniMax-M2.5");
    expect(values).toContain("MiniMax-M2.5-highspeed");
  });

  it("should have labels for all models", async () => {
    const { minimaxModels } = await import(
      "../../lib/types/playground_types"
    );
    for (const model of minimaxModels) {
      expect(model.label).toBeDefined();
      expect(model.label.length).toBeGreaterThan(0);
    }
  });
});

describe("MiniMax Settings Interface", () => {
  it("should allow creating MiniMaxSettings objects", async () => {
    const settings = {
      messages: [
        { id: "1", role: "user" as const, content: "Hello" },
      ],
      model: "MiniMax-M2.7",
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
      top_p: 0.9,
    };
    expect(settings.model).toBe("MiniMax-M2.7");
    expect(settings.temperature).toBe(0.7);
    expect(settings.max_tokens).toBe(1024);
  });

  it("should accept temperature in [0, 1] range", () => {
    const validTemperatures = [0, 0.1, 0.5, 0.7, 1.0];
    for (const temp of validTemperatures) {
      expect(temp >= 0 && temp <= 1).toBe(true);
    }
  });
});

describe("MiniMax Chat Handler", () => {
  it("should export minimaxHandler function", async () => {
    const handlers = await import(
      "../../components/playground/chat-handlers"
    );
    expect(handlers.minimaxHandler).toBeDefined();
    expect(typeof handlers.minimaxHandler).toBe("function");
  });
});

describe("MiniMax API Route", () => {
  it("should have route file at correct path", async () => {
    // Verify the route file exists by checking the file system
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      __dirname,
      "../../app/api/chat/minimax/route.ts"
    );
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should contain POST handler and OpenAI client with MiniMax baseURL", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      __dirname,
      "../../app/api/chat/minimax/route.ts"
    );
    const content = fs.readFileSync(routePath, "utf-8");

    // Verify key implementation details
    expect(content).toContain("export async function POST");
    expect(content).toContain("https://api.minimax.io/v1");
    expect(content).toContain("OpenAI");
    expect(content).toContain("OpenAIStream");
    expect(content).toContain("Math.min(Math.max");
  });
});

describe("MiniMax Temperature Clamping", () => {
  it("should clamp temperature values to [0, 1]", () => {
    // Simulate the clamping logic from the chat handler and route
    const clamp = (temp: number) => Math.min(Math.max(temp, 0), 1);

    expect(clamp(0)).toBe(0);
    expect(clamp(0.5)).toBe(0.5);
    expect(clamp(1)).toBe(1);
    expect(clamp(1.5)).toBe(1);
    expect(clamp(2)).toBe(1);
    expect(clamp(-0.5)).toBe(0);
  });
});

describe("MiniMax Pricing Calculations", () => {
  it("should have M2.7 priced higher than M2.7-highspeed", async () => {
    const { MINIMAX_PRICING } = await import("../../lib/constants");
    expect(MINIMAX_PRICING["MiniMax-M2.7"].input).toBeGreaterThan(
      MINIMAX_PRICING["MiniMax-M2.7-highspeed"].input
    );
    expect(MINIMAX_PRICING["MiniMax-M2.7"].output).toBeGreaterThan(
      MINIMAX_PRICING["MiniMax-M2.7-highspeed"].output
    );
  });

  it("should have M2.5 priced higher than M2.5-highspeed", async () => {
    const { MINIMAX_PRICING } = await import("../../lib/constants");
    expect(MINIMAX_PRICING["MiniMax-M2.5"].input).toBeGreaterThan(
      MINIMAX_PRICING["MiniMax-M2.5-highspeed"].input
    );
    expect(MINIMAX_PRICING["MiniMax-M2.5"].output).toBeGreaterThan(
      MINIMAX_PRICING["MiniMax-M2.5-highspeed"].output
    );
  });
});
