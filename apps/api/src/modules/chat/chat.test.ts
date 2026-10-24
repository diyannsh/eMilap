import { describe, it, expect, vi, beforeEach } from "vitest";
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

    beforeEach(() => {
      service = new ChatService();
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
      // Ensure no external key is active during test
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const res = await service.handleMessage("How do I report a lost phone?");
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.note).toContain("GEMINI_API_KEY or OPENAI_API_KEY");
    });
  });
});
