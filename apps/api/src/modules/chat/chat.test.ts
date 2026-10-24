import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatService, extractSearchTokens } from "./chat.service";
import { chatMessageSchema } from "./chat.schemas";

describe("Chatbot Module Security & Scoping", () => {
  it("extracts clean search tokens without common stop words", () => {
    const tokens = extractSearchTokens("Did anyone find a blue water bottle near the cafeteria?");
    expect(tokens).toContain("blue");
    expect(tokens).toContain("water");
    expect(tokens).toContain("bottle");
    expect(tokens).toContain("near");
    expect(tokens).toContain("cafeteria");
    expect(tokens).not.toContain("did");
    expect(tokens).not.toContain("anyone");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("a");
  });

  it("validates input lengths and rejects empty or oversized inputs", () => {
    // Valid input
    const valid = chatMessageSchema.safeParse({ message: "Where can I report lost keys?" });
    expect(valid.success).toBe(true);

    // Empty input
    const empty = chatMessageSchema.safeParse({ message: "   " });
    expect(empty.success).toBe(false);

    // Oversized input (> 500 characters)
    const oversized = chatMessageSchema.safeParse({ message: "x".repeat(501) });
    expect(oversized.success).toBe(false);
  });

  describe("ChatService Community Scoping & Privacy Enforcement", () => {
    let service: ChatService;
    const originalEnv = { ...process.env };

    beforeEach(() => {
      service = new ChatService();
      vi.restoreAllMocks();
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      vi.restoreAllMocks();
    });

    it("safely refuses mutating actions (claims, approvals, report deletion)", async () => {
      const res = await service.handleMessage("Please submit a claim for the blue water bottle on my behalf");
      expect(res.reply).toContain("read-only information assistant and cannot execute claims");
      expect(res.reply).toContain("Claim This Item");
      expect(res.matchedReports).toEqual([]);
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
    });

    it("provides accurate e-Milap policy guidance on private clues and claims", async () => {
      const claimInfo = await service.handleMessage("How does claiming work?");
      expect(claimInfo.reply).toContain("Campus Listings");
      expect(claimInfo.reply).toContain("Claim This Item");
      expect(claimInfo.reply).toContain("private verification details");

      const clueInfo = await service.handleMessage("What is a private clue and how is encryption used?");
      expect(clueInfo.reply).toContain("AES-256-GCM");
      expect(clueInfo.reply).toContain("never shared publicly");
    });

    it("transparently communicates when optional AI model is unconfigured", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const res = await service.handleMessage("How do I report a lost phone?");
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.note).toContain("GEMINI_API_KEY");
    });

    it("uses active Gemini model (defaults to gemini-2.5-flash or custom GEMINI_MODEL)", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";
      delete process.env.GEMINI_MODEL; // Test default active model

      let capturedUrl = "";
      let capturedBody: any = null;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any, opts: any) => {
        capturedUrl = String(url);
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: "I can help you search for lost electronics in your campus community." }],
                },
              },
            ],
          }),
        } as any;
      });

      const res = await service.handleMessage("Did anyone find headphones in the library?");
      expect(res.configuredModel).toBe(true);
      expect(res.provider).toBe("gemini");
      expect(capturedUrl).toContain("gemini-2.5-flash");
      expect(res.reply).toContain("search for lost electronics");
      expect(res.note).toContain("gemini-2.5-flash");

      // Verify privacy boundary in captured request body (no secret or sensitive data)
      const promptText = capturedBody.contents[0].parts[0].text;
      expect(promptText).not.toContain("privateCluesEncrypted");
      expect(promptText).not.toContain("passwordHash");
      expect(promptText).not.toContain("foundnear.sid");
      expect(promptText).not.toContain("claimEvidence");
      expect(promptText).not.toContain("moderatorAudit");
    });

    it("respects GEMINI_MODEL when configured via environment variable", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";
      process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";

      let capturedUrl = "";
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
        capturedUrl = String(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "Lite response" }] } }],
          }),
        } as any;
      });

      const res = await service.handleMessage("Any lost umbrella?");
      expect(res.configuredModel).toBe(true);
      expect(capturedUrl).toContain("gemini-2.5-flash-lite");
      expect(res.note).toContain("gemini-2.5-flash-lite");
    });

    it("falls back safely to deterministic search when model returns 404 (retired/not found)", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";
      process.env.GEMINI_MODEL = "gemini-deprecated-model";

      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: { message: "models/gemini-deprecated-model is not found" } }),
        } as any;
      });

      const res = await service.handleMessage("Did anyone find a calculator?");
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.reply).toBeDefined();
      expect(res.note).toContain("HTTP 404");
    });

    it("falls back safely without crashing when quota limit (429) is returned", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";

      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { message: "Resource exhausted: quota exceeded" } }),
        } as any;
      });

      const res = await service.handleMessage("Looking for blue backpack");
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.note).toContain("HTTP 429");
    });

    it("falls back safely when API key authentication fails (401/403)", async () => {
      process.env.GEMINI_API_KEY = "invalid-key";

      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return {
          ok: false,
          status: 403,
          json: async () => ({ error: { message: "API key not valid" } }),
        } as any;
      });

      const res = await service.handleMessage("Looking for keys");
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.note).toContain("Verify GEMINI_API_KEY");
      // Never leak the invalid key in the response note
      expect(res.note).not.toContain("invalid-key");
    });
  });
});
