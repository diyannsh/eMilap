import { prisma } from "../../db/client";

export interface PublicReportItem {
  id: string;
  reportType: "LOST" | "FOUND";
  title: string;
  publicDescription: string;
  category: string;
  color: string | null;
  brand: string | null;
  approximateLocation: string | null;
  occurredAt: Date | null;
  status: string;
  createdAt: Date;
}

export interface ChatResponseData {
  reply: string;
  matchedReports: PublicReportItem[];
  provider: string;
  communityId: string;
  communityName: string;
  configuredModel: boolean;
  note: string;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did",
  "i", "me", "my", "we", "our", "you", "your", "he", "him", "she", "her", "it", "its", "they", "them",
  "what", "which", "who", "when", "where", "why", "how", "all", "any", "some", "anyone", "someone",
  "item", "items", "find", "found", "lost", "tell", "show", "check", "please", "help"
]);

export function extractSearchTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

export class ChatService {
  async handleMessage(message: string, communityId?: string): Promise<ChatResponseData> {
    const trimmed = message.trim();

    // 1. Resolve active campus community
    let community = null;
    if (communityId) {
      community = await prisma.community.findFirst({
        where: { id: communityId, isActive: true },
      });
    }
    if (!community) {
      community = await prisma.community.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    const commId = community?.id || "default-community";
    const commName = community?.name || "Campus Lost & Found";

    // 2. Fetch community-scoped public reports ONLY
    // SECURITY: Strictly excludes private clues, claim evidence, credentials, and audit logs
    const publicReports: PublicReportItem[] = community
      ? await prisma.itemReport.findMany({
          where: {
            communityId: community.id,
            status: { not: "REMOVED" },
          },
          select: {
            id: true,
            reportType: true,
            title: true,
            publicDescription: true,
            category: true,
            color: true,
            brand: true,
            approximateLocation: true,
            occurredAt: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 60,
        })
      : [];

    const lowerMsg = trimmed.toLowerCase();

    // 3. Check for mutation attempts (claiming, editing, closing, or moderator actions)
    const isMutationIntent =
      lowerMsg.includes("claim this") ||
      lowerMsg.includes("submit claim") ||
      lowerMsg.includes("submit a claim") ||
      lowerMsg.includes("approve") ||
      lowerMsg.includes("reject") ||
      lowerMsg.includes("delete report") ||
      lowerMsg.includes("remove report") ||
      lowerMsg.includes("close report") ||
      lowerMsg.includes("change status");

    if (isMutationIntent) {
      return {
        reply:
          "I am a read-only information assistant and cannot execute claims, alter report statuses, or make moderation decisions. " +
          "To claim an item, click on the listing card in 'Campus Listings' and press 'Claim This Item'. " +
          "To edit or close your own reports, use the actions inside your report detail modal. " +
          "Moderation actions are reserved for verified campus administrators in the Moderation panel.",
        matchedReports: [],
        provider: "deterministic-retrieval",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: "Deterministic campus search assistant active (Optional AI model not configured). To enable optional LLM generation, set GEMINI_API_KEY or OPENAI_API_KEY in the API environment.",
      };
    }

    // 4. Check for platform policy and workflow guidance
    if (
      lowerMsg.includes("how to claim") ||
      lowerMsg.includes("claim process") ||
      lowerMsg.includes("claim item") ||
      lowerMsg.includes("how do claims work") ||
      lowerMsg.includes("how does claiming work") ||
      lowerMsg.includes("claiming")
    ) {
      return {
        reply:
          "To claim an item on e-Milap:\n" +
          "1. Navigate to 'Campus Listings' and select the found item.\n" +
          "2. Click 'Claim This Item' to open the secure claim dialog.\n" +
          "3. Provide private verification details that only the true owner would know (e.g. unique scratches, serial numbers, engraved initials, or pouch contents) and optionally attach photo evidence.\n" +
          "4. Campus moderators verify these details against encrypted records stored at report time before approving the return.",
        matchedReports: [],
        provider: "deterministic-retrieval",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: "Deterministic campus search assistant active (Optional AI model not configured). To enable optional LLM generation, set GEMINI_API_KEY or OPENAI_API_KEY in the API environment.",
      };
    }

    if (lowerMsg.includes("private clue") || lowerMsg.includes("private detail") || lowerMsg.includes("encryption")) {
      return {
        reply:
          "Private ownership clues are secret details submitted by the reporter (such as engraved initials, lock codes, or distinctive marks) that are encrypted using AES-256-GCM. " +
          "They are strictly separated from public directory feeds and are never shared publicly or sent to third-party models. Only authorized moderators decrypt them during claim review.",
        matchedReports: [],
        provider: "deterministic-retrieval",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: "Deterministic campus search assistant active (Optional AI model not configured). To enable optional LLM generation, set GEMINI_API_KEY or OPENAI_API_KEY in the API environment.",
      };
    }

    if (lowerMsg.includes("how to report") || lowerMsg.includes("report lost") || lowerMsg.includes("report found")) {
      return {
        reply:
          "To report an item on e-Milap:\n" +
          "• If you lost an item: Click 'Report Lost' in the top navigation, specify the item category, title, approximate location, and date. You can also add encrypted private clues to prove ownership later.\n" +
          "• If you found an item: Click 'Report Found', describe its visible appearance, and select the campus location where you found it so the owner can recognize it.",
        matchedReports: [],
        provider: "deterministic-retrieval",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: "Deterministic campus search assistant active (Optional AI model not configured). To enable optional LLM generation, set GEMINI_API_KEY or OPENAI_API_KEY in the API environment.",
      };
    }

    // 5. Query matching over public reports in active community
    const tokens = extractSearchTokens(trimmed);

    let matched: PublicReportItem[] = [];
    if (tokens.length > 0) {
      matched = publicReports.filter((r) => {
        const text = [
          r.title,
          r.publicDescription,
          r.category,
          r.color || "",
          r.brand || "",
          r.approximateLocation || "",
        ]
          .join(" ")
          .toLowerCase();
        return tokens.some((t) => text.includes(t));
      });
    }

    // 6. External LLM Provider Handling (if configured)
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("replace-"));
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("replace-"));

    if (hasGemini || hasOpenAI) {
      try {
        const llmReply = await this.invokeOptionalLLM(trimmed, matched, commName);
        if (llmReply) {
          return {
            reply: llmReply,
            matchedReports: matched.slice(0, 5),
            provider: hasGemini ? "gemini" : "openai",
            communityId: commId,
            communityName: commName,
            configuredModel: true,
            note: `Grounded response generated using ${hasGemini ? "Gemini" : "OpenAI"} scoped strictly to public reports in ${commName}.`,
          };
        }
      } catch (err: any) {
        console.warn(`Optional LLM invocation failed, falling back to deterministic retrieval: ${err.message}`);
      }
    }

    // 7. Deterministic Retrieval Fallback
    if (matched.length > 0) {
      const topMatches = matched.slice(0, 5);
      const itemsList = topMatches
        .map((r, i) => {
          const typeBadge = r.reportType === "FOUND" ? "[FOUND ITEM]" : "[LOST ITEM]";
          const loc = r.approximateLocation ? ` at ${r.approximateLocation}` : "";
          const statusDesc = r.status === "RESOLVED" ? " (Resolved/Returned)" : r.status === "CLOSED" ? " (Closed)" : " (Open)";
          return `${i + 1}. ${typeBadge} **${r.title}** (${r.category})${loc}${statusDesc}`;
        })
        .join("\n");

      return {
        reply:
          `I found ${matched.length} report(s) matching your inquiry in **${commName}**:\n\n${itemsList}\n\n` +
          `You can browse, filter, or claim any open item directly in the **Campus Listings** section.`,
        matchedReports: topMatches,
        provider: "deterministic-retrieval",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: "Deterministic campus search assistant active (Optional AI model not configured). To enable optional LLM generation, set GEMINI_API_KEY or OPENAI_API_KEY in the API environment.",
      };
    }

    return {
      reply:
        `I searched active public reports in **${commName}**, but did not find any items matching "${trimmed}".\n\n` +
        `Tips:\n` +
        `• Check 'Campus Listings' to browse all categories (e.g. Electronics, Bags, Water Bottles).\n` +
        `• If you lost an item, submit a new report via 'Report Lost'.\n` +
        `• If you found someone's property, please report it via 'Report Found' so they can recover it.`,
      matchedReports: [],
      provider: "deterministic-retrieval",
      communityId: commId,
      communityName: commName,
      configuredModel: false,
      note: "Deterministic campus search assistant active (Optional AI model not configured). To enable optional LLM generation, set GEMINI_API_KEY or OPENAI_API_KEY in the API environment.",
    };
  }

  private async invokeOptionalLLM(
    userMessage: string,
    publicReports: PublicReportItem[],
    communityName: string
  ): Promise<string | null> {
    // Only invoke if key is available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return null;

    const publicContext = publicReports.slice(0, 10).map((r) => ({
      type: r.reportType,
      title: r.title,
      category: r.category,
      color: r.color,
      brand: r.brand,
      location: r.approximateLocation,
      status: r.status,
    }));

    const systemPrompt =
      `You are the e-Milap Campus Lost and Found Assistant for ${communityName}. ` +
      `Rules:\n` +
      `1. Only answer based on the provided public reports. Never hallucinate items not listed.\n` +
      `2. Never claim an item is found, matched, or returned unless confirmed in the data.\n` +
      `3. You cannot execute claims or edit reports; direct users to UI buttons.\n` +
      `4. Never ask for or expose private clues, passwords, or personal credentials.\n` +
      `Context Reports: ${JSON.stringify(publicContext)}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const payload = {
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }] },
      ],
      generationConfig: { maxOutputTokens: 300, temperature: 0.2 },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Gemini API error status ${res.status}`);
    }

    const data: any = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }
}

export const chatService = new ChatService();
