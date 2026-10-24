import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatService, extractSearchTokens } from "./chat.service";
import { chatMessageSchema } from "./chat.schemas";
import { prisma } from "../../db/client";

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

    // Valid history items
    const withHistory = chatMessageSchema.safeParse({
      message: "where do I report it?",
      history: [
        { role: "user", content: "I lost my blue backpack" },
        { role: "assistant", content: "I can help with that." },
      ],
    });
    expect(withHistory.success).toBe(true);

    // History over limit (> 10 items)
    const tooManyHistory = chatMessageSchema.safeParse({
      message: "test",
      history: Array.from({ length: 11 }, (_, i) => ({ role: "user", content: `msg ${i}` })),
    });
    expect(tooManyHistory.success).toBe(false);
  });

  describe("ChatService Community Scoping & Privacy Enforcement", () => {
    let service: ChatService;
    const originalEnv = { ...process.env };

    beforeEach(() => {
      service = new ChatService();
      ChatService.clearModelCache();
      vi.restoreAllMocks();
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      vi.restoreAllMocks();
    });

    it("responds appropriately to natural greetings with real campus actions", async () => {
      delete process.env.GEMINI_API_KEY;

      const greetings = ["hi", "hello", "hey", "good morning"];
      for (const greeting of greetings) {
        const res = await service.handleMessage(greeting);
        expect(res.reply).toContain("Milap.ai");
        expect(res.reply).toContain("Report Lost");
        expect(res.reply).toContain("Report Found");
        expect(res.reply).toContain("Campus Listings");
        expect(res.actions).toBeDefined();
        const views = res.actions?.map((a) => a.view);
        expect(views).toContain("report_lost");
        expect(views).toContain("report_found");
        expect(views).toContain("browse");
      }
    });

    it("asks a clarifying question when item intent is ambiguous", async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await service.handleMessage("blue backpack");
      expect(res.reply.toLowerCase()).toMatch(/did you .*lose.* this item, or did you .*find.* it/i);
      expect(res.reply).toContain("[Report Lost](#report-lost)");
      expect(res.reply).toContain("[Report Found](#report-found)");
      expect(res.actions).toBeDefined();
      const views = res.actions?.map((a) => a.view);
      expect(views).toContain("report_lost");
      expect(views).toContain("report_found");
    });

    it("uses multi-turn conversation history to resolve follow-up questions", async () => {
      delete process.env.GEMINI_API_KEY;

      // Case 1: Prior context was 'lost'
      const lostFollowUp = await service.handleMessage("where do I report it?", undefined, [
        { role: "user", content: "I lost my blue backpack near the cafeteria" },
        { role: "assistant", content: "I understand you lost a blue backpack." },
      ]);
      expect(lostFollowUp.reply).toContain("Report Lost");
      expect(lostFollowUp.actions?.some((a) => a.view === "report_lost")).toBe(true);

      // Case 2: Prior context was 'found'
      const foundFollowUp = await service.handleMessage("how do I report?", undefined, [
        { role: "user", content: "I found a pair of glasses in the library" },
        { role: "assistant", content: "Thank you for finding the glasses." },
      ]);
      expect(foundFollowUp.reply).toContain("Report Found");
      expect(foundFollowUp.actions?.some((a) => a.view === "report_found")).toBe(true);
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
      expect(claimInfo.actions?.some((a) => a.view === "claims")).toBe(true);

      const clueInfo = await service.handleMessage("What is a private clue and how is encryption used?");
      expect(clueInfo.reply).toContain("AES-256-GCM");
      expect(clueInfo.reply).toContain("never shared publicly");
    });

    it("provides accurate desk location and operating hours", async () => {
      const res = await service.handleMessage("Where is the lost and found office desk?");
      expect(res.reply).toContain("Administration Building");
      expect(res.reply).toContain("Room 104");
      expect(res.reply).toContain("Monday to Friday: 8:30 AM");
    });

    it("guides users to automated matches and notifications", async () => {
      const matchRes = await service.handleMessage("How do possible matches work?");
      expect(matchRes.reply).toContain("Possible Matches");
      expect(matchRes.actions?.some((a) => a.view === "matches")).toBe(true);

      const notifRes = await service.handleMessage("Where are my notifications and updates?");
      expect(notifRes.reply).toContain("Updates & Alerts");
      expect(notifRes.actions?.some((a) => a.view === "notifications")).toBe(true);
    });

    it("transparently communicates when optional AI model is unconfigured", async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const res = await service.handleMessage("How do I report a lost phone?");
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.status).toBe("unconfigured");
      expect(res.model).toBe("none");
      expect(res.note).toContain("GEMINI_API_KEY");
    });

    it("uses active Gemini model with multi-turn history and extracts clickable actions", async () => {
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
                  parts: [
                    {
                      text: "I found a matching report. You can review it in [Campus Listings](#browse) or file a report via [Report Lost](#report-lost).",
                    },
                  ],
                },
              },
            ],
          }),
        } as any;
      });

      const res = await service.handleMessage(
        "Did anyone turn in a calculator?",
        undefined,
        [{ role: "user", content: "I lost my calculator yesterday in the lecture hall." }]
      );

      expect(res.configuredModel).toBe(true);
      expect(res.provider).toBe("gemini");
      expect(res.status).toBe("success");
      expect(res.model).toBe("gemini-2.5-flash");
      expect(capturedUrl).toContain("gemini-2.5-flash");
      expect(res.note).toContain("gemini-2.5-flash");

      // Verify actions were extracted from markdown links in response
      expect(res.actions).toBeDefined();
      const views = res.actions?.map((a) => a.view);
      expect(views).toContain("browse");
      expect(views).toContain("report_lost");

      // Verify multi-turn history was included in Gemini request payload
      expect(capturedBody.contents.length).toBeGreaterThan(1);
      const pastPart = capturedBody.contents[0].parts[0].text;
      expect(pastPart).toContain("lost my calculator yesterday");

      // Verify privacy boundary in captured request body (no secret or sensitive data)
      const fullPayloadText = JSON.stringify(capturedBody);
      expect(fullPayloadText).not.toContain("privateCluesEncrypted");
      expect(fullPayloadText).not.toContain("passwordHash");
      expect(fullPayloadText).not.toContain("foundnear.sid");
      expect(fullPayloadText).not.toContain("claimEvidence");
      expect(fullPayloadText).not.toContain("moderatorAudit");
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
      expect(res.provider).toBe("gemini");
      expect(res.status).toBe("success");
      expect(res.model).toBe("gemini-2.5-flash-lite");
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
      expect(res.status).toBe("unavailable_model");
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
      expect(res.status).toBe("quota");
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
      expect(res.status).toBe("invalid_key");
      expect(res.note).toContain("Verify GEMINI_API_KEY");
      // Never leak the invalid key in the response note
      expect(res.note).not.toContain("invalid-key");
    });

    it("accurately handles user asking 'Hi, I lost something. Where can I report it?' on the first turn", async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await service.handleMessage("Hi, I lost something. Where can I report it?", undefined, []);
      expect(res.reply).toContain("[Report Lost](#report-lost)");
      expect(res.reply).not.toContain("I couldn't find an existing found report matching");
      expect(res.actions).toBeDefined();
      const views = res.actions?.map((a) => a.view);
      expect(views).toContain("report_lost");
    });

    it("accurately handles user asking 'Where can I report a found item?' on the first turn", async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await service.handleMessage("Where can I report an item I found?", undefined, []);
      expect(res.reply).toContain("[Report Found](#report-found)");
      expect(res.reply).toContain("Admin Block, Room 104");
      expect(res.actions).toBeDefined();
      const views = res.actions?.map((a) => a.view);
      expect(views).toContain("report_found");
    });

    it("handles Gemini API timeouts gracefully without hanging", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";

      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        throw err;
      });

      const res = await service.handleMessage("I lost my umbrella in the cafeteria");
      expect(res.configuredModel).toBe(false);
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.status).toBe("timeout");
      expect(res.note).toContain("timed out");
    });

    it("dynamically resolves active Gemini models using models list while skipping shut-down models", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";

      let calledUrl = "";
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
        const u = String(url);
        if (u.includes("/v1beta/models?key=")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              models: [
                { name: "models/gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
                { name: "models/gemini-1.5-flash", supportedGenerationMethods: ["generateContent"] },
                { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
              ],
            }),
          } as any;
        }

        calledUrl = u;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "Dynamic model response" }] } }],
          }),
        } as any;
      });

      const res = await service.handleMessage("Where is my calculator?");
      expect(res.configuredModel).toBe(true);
      expect(res.provider).toBe("gemini");
      expect(res.status).toBe("success");
      expect(res.model).toBe("gemini-2.5-flash");
      expect(calledUrl).toContain("gemini-2.5-flash");
      expect(calledUrl).not.toContain("gemini-2.0-flash");
      expect(calledUrl).not.toContain("gemini-1.5-flash");
    });

    it("strictly blocks configured shut-down models without invoking network", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";
      process.env.GEMINI_MODEL = "gemini-1.5-flash";

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const res = await service.handleMessage("Where is my water bottle?");
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.status).toBe("unavailable_model");
      expect(res.model).toBe("gemini-1.5-flash");
      expect(res.configuredModel).toBe(false);
      expect(res.note).toContain("shut down");
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("strictly blocks configured gemini-2.0-flash without invoking network", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";
      process.env.GEMINI_MODEL = "gemini-2.0-flash";

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const res = await service.handleMessage("Where is my water bottle?");
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.status).toBe("unavailable_model");
      expect(res.model).toBe("gemini-2.0-flash");
      expect(res.configuredModel).toBe(false);
      expect(res.note).toContain("shut down");
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("falls back safely to deterministic retrieval when discovery returns only retired models", async () => {
      process.env.GEMINI_API_KEY = "test-ai-key-12345";

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
        const u = String(url);
        if (u.includes("/v1beta/models?key=")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              models: [
                { name: "models/gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
                { name: "models/gemini-1.5-flash", supportedGenerationMethods: ["generateContent"] },
              ],
            }),
          } as any;
        }
        return { ok: false, status: 500 } as any;
      });

      const res = await service.handleMessage("Where is my umbrella?");
      expect(res.provider).toBe("deterministic-retrieval");
      expect(res.status).toBe("unavailable_model");
      expect(res.configuredModel).toBe(false);
      expect(res.reply).toBeDefined();
    });

    it("emits sanitized server-side observability logs without exposing secrets", async () => {
      process.env.GEMINI_API_KEY = "super-secret-key-99999";
      process.env.GEMINI_MODEL = "gemini-2.5-flash";

      const consoleLogs: string[] = [];
      vi.spyOn(console, "log").mockImplementation((...args: any[]) => {
        consoleLogs.push(args.join(" "));
      });

      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: "Observability test response" }] } }],
          }),
        } as any;
      });

      const res = await service.handleMessage("Looking for my private laptop with confidential serial number XYZ");
      expect(res.status).toBe("success");
      expect(res.provider).toBe("gemini");

      // Verify safe observability log was generated
      const obsLog = consoleLogs.find((l) => l.includes("[e-Milap Chat Observability]"));
      expect(obsLog).toBeDefined();
      expect(obsLog).toContain("provider=gemini");
      expect(obsLog).toContain("status=success");
      expect(obsLog).toContain("model=gemini-2.5-flash");
      expect(obsLog).toContain("durationMs=");

      // Strictly verify no secret, key, or sensitive user text leaked into server logs
      for (const log of consoleLogs) {
        expect(log).not.toContain("super-secret-key-99999");
        expect(log).not.toContain("confidential serial number XYZ");
        expect(log).not.toContain("foundnear.sid");
        expect(log).not.toContain("cookie");
      }
    });

    it("remains resilient and functional even if database connection fails", async () => {
      delete process.env.GEMINI_API_KEY;
      vi.spyOn(prisma.community, "findFirst").mockRejectedValue(new Error("Database connection pool timeout"));

      const res = await service.handleMessage("Hi, I lost something. Where can I report it?");
      expect(res.reply).toContain("[Report Lost](#report-lost)");
      expect(res.actions?.some((a) => a.view === "report_lost")).toBe(true);
      expect(res.communityName).toBe("Campus Lost & Found");
    });
  });
});
