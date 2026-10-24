import { prisma } from "../../db/client";
import { ChatHistoryItem } from "./chat.schemas";

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

export interface ChatAction {
  label: string;
  view: string;
  url?: string;
}

export type ChatProviderStatus =
  | "success"
  | "timeout"
  | "quota"
  | "invalid_key"
  | "unavailable_model"
  | "network_error"
  | "unconfigured";

export interface ChatResponseData {
  reply: string;
  matchedReports: PublicReportItem[];
  actions?: ChatAction[];
  action?: ChatAction | null;
  provider: "gemini" | "deterministic-retrieval";
  status: ChatProviderStatus;
  model: string;
  communityId: string;
  communityName: string;
  configuredModel: boolean;
  note: string;
}

export type RouteActionKey =
  | "report_lost"
  | "report_found"
  | "browse"
  | "matches"
  | "claims"
  | "notifications"
  | "admin"
  | "settings"
  | "dashboard";

export const ROUTE_ACTIONS: Record<RouteActionKey, ChatAction> = {
  report_lost: { label: "Report Lost Item", view: "report_lost", url: "#report-lost" },
  report_found: { label: "Report Found Item", view: "report_found", url: "#report-found" },
  browse: { label: "Browse Campus Listings", view: "browse", url: "#browse" },
  matches: { label: "Check Possible Matches", view: "matches", url: "#matches" },
  claims: { label: "View Ownership Claims", view: "claims", url: "#claims" },
  notifications: { label: "View Updates & Alerts", view: "notifications", url: "#updates" },
  admin: { label: "Open Moderation Panel", view: "admin", url: "#moderation" },
  settings: { label: "Account Settings", view: "settings", url: "#settings" },
  dashboard: { label: "Go to Dashboard", view: "dashboard", url: "#overview" },
};

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
  "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did",
  "i", "me", "my", "we", "our", "you", "your", "he", "him", "she", "her", "it", "its", "they", "them",
  "what", "which", "who", "when", "where", "why", "how", "all", "any", "some", "anyone", "someone",
  "item", "items", "tell", "show", "check", "please", "help", "can", "could", "would", "there", "this", "that"
]);

// Known shut-down / retired Gemini models that must never be called
const SHUTDOWN_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-exp",
  "gemini-2.0-pro-exp",
]);

// Preferred active Flash models in priority order recommended by Google AI documentation
export const PREFERRED_MODELS_PRIORITY = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

export function selectBestAvailableModel(availableModels: string[]): string {
  const validModels = availableModels.filter((m) => !SHUTDOWN_MODELS.has(m));
  if (validModels.length === 0) return "";

  // 1. Check preferred models in exact priority order (e.g. gemini-3.8-flash, gemini-3.5-flash-lite)
  for (const preferred of PREFERRED_MODELS_PRIORITY) {
    const matched = validModels.find((m) => m.toLowerCase() === preferred.toLowerCase());
    if (matched) return matched;
  }

  // 2. Prioritize any other Flash model
  const anyFlash = validModels.find((m) => m.toLowerCase().includes("flash"));
  if (anyFlash) return anyFlash;

  // 3. Fall back to first valid active model
  return validModels[0] || "";
}

export function extractSearchTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

function extractActionsFromText(text: string): ChatAction[] {
  const actions: ChatAction[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("#report-lost") || lower.includes("report_lost")) {
    actions.push(ROUTE_ACTIONS.report_lost);
  }
  if (lower.includes("#report-found") || lower.includes("report_found")) {
    actions.push(ROUTE_ACTIONS.report_found);
  }
  if (lower.includes("#browse") || lower.includes("campus listings") || lower.includes("explore campus listings")) {
    actions.push(ROUTE_ACTIONS.browse);
  }
  if (lower.includes("#matches") || lower.includes("possible matches")) {
    actions.push(ROUTE_ACTIONS.matches);
  }
  if (lower.includes("#claims") || lower.includes("ownership claims")) {
    actions.push(ROUTE_ACTIONS.claims);
  }
  if (lower.includes("#updates") || lower.includes("notifications")) {
    actions.push(ROUTE_ACTIONS.notifications);
  }
  if (lower.includes("#moderation") || lower.includes("moderation panel")) {
    actions.push(ROUTE_ACTIONS.admin);
  }
  if (lower.includes("#settings") || lower.includes("account settings")) {
    actions.push(ROUTE_ACTIONS.settings);
  }

  // Deduplicate by view
  const seen = new Set<string>();
  return actions.filter((a) => {
    if (seen.has(a.view)) return false;
    seen.add(a.view);
    return true;
  });
}

interface ChatLogDetails {
  provider: "gemini" | "deterministic-retrieval";
  status: ChatProviderStatus;
  model: string;
  communityId: string;
  durationMs: number;
  reason?: string;
}

function logChatObservability(details: ChatLogDetails) {
  // Safe server-side log: NEVER logs API key, cookies, headers, or private user text
  const parts = [
    `[e-Milap Chat Observability]`,
    `provider=${details.provider}`,
    `status=${details.status}`,
    `model=${details.model || "none"}`,
    `communityId=${details.communityId}`,
    `durationMs=${details.durationMs}`,
  ];
  if (details.reason) {
    const sanitizedReason = details.reason.replace(/[\r\n]/g, " ").slice(0, 120);
    parts.push(`reason="${sanitizedReason}"`);
  }
  console.log(parts.join(" "));
}

interface CreateResponseParams {
  reply: string;
  matchedReports: PublicReportItem[];
  actions?: ChatAction[];
  action?: ChatAction | null;
  provider: "gemini" | "deterministic-retrieval";
  status: ChatProviderStatus;
  model: string;
  communityId: string;
  communityName: string;
  configuredModel: boolean;
  note: string;
  startTime: number;
  reason?: string;
}

function createResponse(params: CreateResponseParams): ChatResponseData {
  const durationMs = Date.now() - params.startTime;
  logChatObservability({
    provider: params.provider,
    status: params.status,
    model: params.model,
    communityId: params.communityId,
    durationMs,
    reason: params.reason,
  });

  return {
    reply: params.reply,
    matchedReports: params.matchedReports,
    actions: params.actions,
    action: params.action,
    provider: params.provider,
    status: params.status,
    model: params.model,
    communityId: params.communityId,
    communityName: params.communityName,
    configuredModel: params.configuredModel,
    note: params.note,
  };
}

export class ChatService {
  private static cachedAvailableModels: { list: string[]; timestamp: number } | null = null;

  public static clearModelCache() {
    ChatService.cachedAvailableModels = null;
  }

  async handleMessage(
    message: string,
    communityId?: string,
    history: ChatHistoryItem[] = []
  ): Promise<ChatResponseData> {
    const startTime = Date.now();
    const trimmed = message.trim();

    // 1. Resolve active campus community
    let community = null;
    try {
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
    } catch {
      // Degraded / database offline resilience: keep chat functional with default community
    }

    const commId = community?.id || "default-community";
    const commName = community?.name || "Campus Lost & Found";

    // 2. Fetch community-scoped public reports ONLY
    // SECURITY: Strictly excludes private clues, claim evidence, credentials, and audit logs
    let publicReports: PublicReportItem[] = [];
    try {
      if (community) {
        publicReports = await prisma.itemReport.findMany({
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
        });
      }
    } catch {
      // Degraded / database offline resilience: continue with empty reports list
    }

    const lowerMsg = trimmed.toLowerCase();

    // 3. Safety Check: Disallow mutation attempts (claims, approvals, report deletion)
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
      const actions = [ROUTE_ACTIONS.browse, ROUTE_ACTIONS.claims];
      return createResponse({
        reply:
          "I am a read-only information assistant and cannot execute claims, alter report statuses, or make moderation decisions. " +
          "To claim an item, click on the listing card in [Campus Listings](#browse) and press **Claim This Item**. " +
          "To view status updates on your existing claims, visit [Ownership Claims](#claims). " +
          "To edit or close your own reports, use the actions inside your report detail modal. " +
          "Moderation actions are reserved for verified campus administrators in the [Moderation](#moderation) panel.",
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: "Deterministic campus search assistant active (Optional AI model not configured). To enable optional LLM generation, set GEMINI_API_KEY in the API environment with a model available on your free tier.",
        startTime,
      });
    }

    const defaultNote =
      "Deterministic campus search assistant active (GEMINI_API_KEY not configured). To enable optional live AI responses, configure GEMINI_API_KEY with a model available on your Google AI Studio free tier. Billing is never required.";

    // 4. Greetings intent
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup|yo|greetings)\b/i.test(lowerMsg);
    if (isGreeting && lowerMsg.split(/\s+/).length <= 4) {
      const actions = [ROUTE_ACTIONS.report_lost, ROUTE_ACTIONS.report_found, ROUTE_ACTIONS.browse];
      return createResponse({
        reply:
          `Hello! 👋 I'm **Milap.ai**, your campus lost & found assistant for **${commName}**.\n\n` +
          `I can help you navigate lost and found recovery across campus:\n` +
          `• **Lost something?** File a report via [Report Lost](#report-lost) so our matching engine can notify you when it turns up.\n` +
          `• **Found an item?** Submit a [Report Found](#report-found) listing or check drop-off locations.\n` +
          `• **Browse items:** Check [Campus Listings](#browse) to view items found in library, cafeteria, or lecture halls.\n` +
          `• **Ownership Claims:** Learn how to verify property using encrypted private clues in [Ownership Claims](#claims).\n\n` +
          `How can I help you today?`,
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // 5. Reporting Inquiries & Multi-turn Follow-up Context Resolution
    const isGenericReportQuery =
      lowerMsg.includes("where do i report") ||
      lowerMsg.includes("how do i report") ||
      lowerMsg.includes("where can i report") ||
      lowerMsg.includes("how can i report") ||
      lowerMsg.includes("how to report it") ||
      lowerMsg.includes("where to report") ||
      lowerMsg.includes("how to report") ||
      lowerMsg.includes("what should i do next") ||
      lowerMsg.includes("how do i submit") ||
      lowerMsg.includes("where can i submit");

    if (isGenericReportQuery) {
      // Look at current message + prior user messages in history to detect if user lost or found an item
      const pastUserMessages = history.filter((h) => h.role === "user").map((h) => h.content.toLowerCase());
      const fullContext = (pastUserMessages.join(" ") + " " + lowerMsg).toLowerCase();

      const wasLost = fullContext.includes("lost") || fullContext.includes("missing") || fullContext.includes("misplaced") || fullContext.includes("can't find");
      const wasFound = fullContext.includes("found") || fullContext.includes("picked up") || fullContext.includes("turned in");

      if (wasLost && !wasFound) {
        const actions = [ROUTE_ACTIONS.report_lost, ROUTE_ACTIONS.browse, ROUTE_ACTIONS.matches];
        return createResponse({
          reply:
            `To report a lost item on e-Milap:\n\n` +
            `1. Open **[Report Lost](#report-lost)** in the navigation.\n` +
            `2. Select the item category, title, approximate campus location, and when you last saw it.\n` +
            `3. Add an encrypted private clue (such as serial numbers, engraved initials, or pouch contents) so only you can verify ownership once it is found.\n` +
            `4. You can also explore existing records in **[Campus Listings](#browse)** to see if someone already turned it in.`,
          matchedReports: [],
          actions,
          action: actions[0],
          provider: "deterministic-retrieval",
          status: "unconfigured",
          model: "none",
          communityId: commId,
          communityName: commName,
          configuredModel: false,
          note: defaultNote,
          startTime,
        });
      }

      if (wasFound && !wasLost) {
        const actions = [ROUTE_ACTIONS.report_found, ROUTE_ACTIONS.browse];
        return createResponse({
          reply:
            `Thank you for helping return property! You can log the item you found by opening **[Report Found](#report-found)**.\n\n` +
            `**Guidelines:**\n` +
            `• Describe the visible appearance and campus location where you found it.\n` +
            `• Keep private identifying details (lockscreen, wallet contents) hidden so the true owner can prove ownership.\n` +
            `• You can deposit the item at the **Campus Lost & Found Desk (Admin Block, Room 104)** for safe keeping.`,
          matchedReports: [],
          actions,
          action: actions[0],
          provider: "deterministic-retrieval",
          status: "unconfigured",
          model: "none",
          communityId: commId,
          communityName: commName,
          configuredModel: false,
          note: defaultNote,
          startTime,
        });
      }

      // If neither or both
      const actions = [ROUTE_ACTIONS.report_lost, ROUTE_ACTIONS.report_found, ROUTE_ACTIONS.browse];
      return createResponse({
        reply:
          `To report an item on e-Milap:\n\n` +
          `• **If you lost an item:** Click **[Report Lost](#report-lost)** to log details and submit encrypted verification clues.\n` +
          `• **If you found an item:** Click **[Report Found](#report-found)** to describe where you found it or deposit it at Admin Block Room 104.\n` +
          `• Check **[Campus Listings](#browse)** to browse all current active listings.`,
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // 6. Explicit Feature & Policy Guidance
    // Claims & Verification
    if (
      lowerMsg.includes("how to claim") ||
      lowerMsg.includes("claim process") ||
      lowerMsg.includes("claim item") ||
      lowerMsg.includes("how do claims work") ||
      lowerMsg.includes("how does claiming work") ||
      lowerMsg.includes("prove ownership") ||
      lowerMsg.includes("verification process") ||
      lowerMsg.includes("ownership verification")
    ) {
      const actions = [ROUTE_ACTIONS.claims, ROUTE_ACTIONS.browse];
      return createResponse({
        reply:
          "To claim an item on e-Milap:\n" +
          "1. Navigate to [Campus Listings](#browse) and select the found item.\n" +
          "2. Click **Claim This Item** to open the secure claim dialog.\n" +
          "3. Provide private verification details that only the true owner would know (e.g. distinctive scratches, serial numbers, pouch contents, or passcode demonstration) and optionally attach photo evidence.\n" +
          "4. Campus moderators verify these details against encrypted records stored at report time before approving the return.\n" +
          "5. Track claim status in [Ownership Claims](#claims).",
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // Private clues & Encryption
    if (lowerMsg.includes("private clue") || lowerMsg.includes("private detail") || lowerMsg.includes("encryption")) {
      return createResponse({
        reply:
          "Private ownership clues are secret details submitted by the reporter (such as engraved initials, lock codes, or distinctive marks) that are encrypted using **AES-256-GCM**. " +
          "They are strictly separated from public directory feeds and are never shared publicly or sent to third-party models. Only authorized moderators decrypt them during claim review.",
        matchedReports: [],
        actions: [ROUTE_ACTIONS.browse],
        action: ROUTE_ACTIONS.browse,
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // Desk location, hours, and contact
    if (
      lowerMsg.includes("where is the office") ||
      lowerMsg.includes("desk location") ||
      lowerMsg.includes("office hours") ||
      lowerMsg.includes("operating hours") ||
      lowerMsg.includes("admin block") ||
      lowerMsg.includes("helpline") ||
      lowerMsg.includes("contact number") ||
      lowerMsg.includes("lost and found office") ||
      lowerMsg.includes("where to drop off") ||
      lowerMsg.includes("drop off location")
    ) {
      return createResponse({
        reply:
          "📍 **Campus Lost & Found Collection & Drop-off Desk**\n\n" +
          "• **Location:** Administration Building, Ground Floor, Room 104 (Next to Student Services)\n" +
          "• **Operating Hours:**\n" +
          "  – Monday to Friday: 8:30 AM – 5:30 PM\n" +
          "  – Saturday: 9:00 AM – 1:00 PM\n" +
          "  – Sunday & Campus Holidays: Closed\n" +
          "• **Helpline:** Ext. 4421 / security@campus.edu",
        matchedReports: [],
        actions: [ROUTE_ACTIONS.browse, ROUTE_ACTIONS.report_found],
        action: ROUTE_ACTIONS.browse,
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // Matches
    if (
      lowerMsg.includes("possible match") ||
      lowerMsg.includes("how do matches work") ||
      lowerMsg.includes("matching engine") ||
      lowerMsg.includes("automatic match")
    ) {
      const actions = [ROUTE_ACTIONS.matches, ROUTE_ACTIONS.browse];
      return createResponse({
        reply:
          "e-Milap features an automated matching engine that cross-references new Lost and Found reports by Category, Location Zone, Date Range, and visual descriptors. " +
          "When a potential match is found, both parties receive a notification and can review potential matches in [Possible Matches](#matches).",
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // Notifications / Updates
    if (lowerMsg.includes("notification") || lowerMsg.includes("alerts") || lowerMsg.includes("status update")) {
      const actions = [ROUTE_ACTIONS.notifications, ROUTE_ACTIONS.dashboard];
      return createResponse({
        reply:
          "You can review your system updates, match alerts, and claim reviews in [Updates & Alerts](#updates). " +
          "Whenever a moderator approves your claim or an item matches your report, a notification will appear there.",
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // Account / Settings / Profile
    if (
      lowerMsg.includes("account") ||
      lowerMsg.includes("settings") ||
      lowerMsg.includes("profile") ||
      lowerMsg.includes("change password") ||
      lowerMsg.includes("community switch")
    ) {
      const actions = [ROUTE_ACTIONS.settings];
      return createResponse({
        reply:
          "You can manage your campus profile, update display settings, and switch active campus communities in [Account Settings](#settings).",
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // Moderation / Admin
    if (lowerMsg.includes("moderation") || lowerMsg.includes("admin panel") || lowerMsg.includes("moderator")) {
      const actions = [ROUTE_ACTIONS.admin];
      return createResponse({
        reply:
          "Campus administrators and verified staff can review submitted claims, verify encrypted private clues, and manage community reports in the [Moderation Panel](#moderation).",
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: "unconfigured",
        model: "none",
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: defaultNote,
        startTime,
      });
    }

    // 7. Query matching over public reports in active community
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

    // 8. Intent polarity detection: Lost vs Found vs Ambiguous
    const hasLostIntent =
      lowerMsg.includes("lost") ||
      lowerMsg.includes("misplaced") ||
      lowerMsg.includes("missing") ||
      lowerMsg.includes("can't find") ||
      lowerMsg.includes("dropped my") ||
      lowerMsg.includes("left behind") ||
      lowerMsg.includes("where is my") ||
      lowerMsg.includes("forgot my");

    const hasFoundIntent =
      lowerMsg.includes("found") ||
      lowerMsg.includes("picked up") ||
      lowerMsg.includes("turned in") ||
      lowerMsg.includes("someone left") ||
      lowerMsg.includes("handed in") ||
      lowerMsg.includes("deposit");

    // 9. External LLM Provider Handling (if configured)
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("replace-"));
    let llmFallbackReason: string | null = null;
    let fallbackStatus: ChatProviderStatus = hasGeminiKey ? "unavailable_model" : "unconfigured";
    let attemptedModel = "none";

    if (hasGeminiKey) {
      const llmResult = await this.invokeOptionalLLM(trimmed, matched, commName, history);
      attemptedModel = llmResult.model;
      if (llmResult.reply && llmResult.status === "success") {
        const extractedActions = extractActionsFromText(llmResult.reply);
        if (extractedActions.length === 0 && matched.length > 0) {
          extractedActions.push(ROUTE_ACTIONS.browse);
        }
        return createResponse({
          reply: llmResult.reply,
          matchedReports: matched.slice(0, 5),
          actions: extractedActions,
          action: extractedActions[0] || null,
          provider: "gemini",
          status: "success",
          model: llmResult.model,
          communityId: commId,
          communityName: commName,
          configuredModel: true,
          note: `Grounded response generated using Gemini (${llmResult.model}) scoped strictly to public reports in ${commName}.`,
          startTime,
        });
      }
      fallbackStatus = llmResult.status;
      if (llmResult.errorReason) {
        llmFallbackReason = `Live Gemini response unavailable (${llmResult.errorReason}). Fallen back safely to deterministic campus search.`;
      }
    }

    const activeNote = llmFallbackReason || defaultNote;

    // 10. Ambiguity Handling: If query mentions items/tokens but lacks explicit Lost vs Found intent
    // e.g. "blue backpack", "keys", "calculator in library", "umbrella", "airpods"
    const isAmbiguousQuery = !hasLostIntent && !hasFoundIntent && tokens.length > 0;

    if (isAmbiguousQuery) {
      const topMatches = matched.slice(0, 5);
      const itemsList =
        topMatches.length > 0
          ? "\n\nHere are matching listings currently in **" +
            commName +
            "**:\n" +
            topMatches
              .map((r, i) => {
                const typeBadge = r.reportType === "FOUND" ? "[FOUND ITEM]" : "[LOST ITEM]";
                const loc = r.approximateLocation ? ` at ${r.approximateLocation}` : "";
                return `${i + 1}. ${typeBadge} **${r.title}** (${r.category})${loc}`;
              })
              .join("\n")
          : "";

      const actions = [
        { label: "I Lost This", view: "report_lost", url: "#report-lost" },
        { label: "I Found This", view: "report_found", url: "#report-found" },
        ROUTE_ACTIONS.browse,
      ];

      return createResponse({
        reply:
          `Did you **lose** this item, or did you **find** it on campus?\n\n` +
          `• **If you lost it:** Click **[Report Lost](#report-lost)** so our system can search for matches and alert you when someone turns it in.\n` +
          `• **If you found it:** Click **[Report Found](#report-found)** or deposit it at the Campus Desk (Admin Block 104) to help the owner recover it.\n` +
          `• You can also explore existing records in **[Campus Listings](#browse)**.${itemsList}`,
        matchedReports: topMatches,
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: fallbackStatus,
        model: attemptedModel,
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: activeNote,
        startTime,
        reason: llmFallbackReason || undefined,
      });
    }

    // 11. Explicit Lost intent with or without matches
    if (hasLostIntent) {
      const foundMatches = matched.filter((m) => m.reportType === "FOUND").slice(0, 5);
      const actions = [ROUTE_ACTIONS.report_lost, ROUTE_ACTIONS.browse, ROUTE_ACTIONS.matches];

      if (foundMatches.length > 0) {
        const itemsList = foundMatches
          .map((r, i) => {
            const loc = r.approximateLocation ? ` at ${r.approximateLocation}` : "";
            return `${i + 1}. [FOUND ITEM] **${r.title}** (${r.category})${loc}`;
          })
          .join("\n");

        return createResponse({
          reply:
            `I found ${foundMatches.length} turned-in item(s) in **${commName}** that may match what you lost:\n\n${itemsList}\n\n` +
            `If one of these is yours, visit **[Campus Listings](#browse)** to review details and click **Claim This Item** to submit ownership proof.\n\n` +
            `If none match, please file a report via **[Report Lost](#report-lost)** so our match engine can notify you as soon as someone finds it.`,
          matchedReports: foundMatches,
          actions,
          action: actions[0],
          provider: "deterministic-retrieval",
          status: fallbackStatus,
          model: attemptedModel,
          communityId: commId,
          communityName: commName,
          configuredModel: false,
          note: activeNote,
          startTime,
          reason: llmFallbackReason || undefined,
        });
      }

      return createResponse({
        reply:
          `I couldn't find an existing found report matching "${trimmed}" in **${commName}** yet.\n\n` +
          `**Next Steps:**\n` +
          `1. Submit a **[Report Lost](#report-lost)** with category, last seen zone, and private verification clues.\n` +
          `2. Check **[Campus Listings](#browse)** periodically or view **[Possible Matches](#matches)** for automated updates.\n` +
          `3. Check with the Campus Security Desk at Admin Block Rm 104 in case an item was turned in without a web report.`,
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: fallbackStatus,
        model: attemptedModel,
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: activeNote,
        startTime,
        reason: llmFallbackReason || undefined,
      });
    }

    // 12. Explicit Found intent
    if (hasFoundIntent) {
      const lostMatches = matched.filter((m) => m.reportType === "LOST").slice(0, 5);
      const actions = [ROUTE_ACTIONS.report_found, ROUTE_ACTIONS.browse];

      if (lostMatches.length > 0) {
        const itemsList = lostMatches
          .map((r, i) => {
            const loc = r.approximateLocation ? ` last seen at ${r.approximateLocation}` : "";
            return `${i + 1}. [LOST ITEM] **${r.title}** (${r.category})${loc}`;
          })
          .join("\n");

        return createResponse({
          reply:
            `Thank you for helping out! Someone has reported losing a similar item in **${commName}**:\n\n${itemsList}\n\n` +
            `Please submit a report via **[Report Found](#report-found)** or deposit the item at the **Campus Desk (Admin Block 104)** so the owner can verify their claim securely.`,
          matchedReports: lostMatches,
          actions,
          action: actions[0],
          provider: "deterministic-retrieval",
          status: fallbackStatus,
          model: attemptedModel,
          communityId: commId,
          communityName: commName,
          configuredModel: false,
          note: activeNote,
          startTime,
          reason: llmFallbackReason || undefined,
        });
      }

      return createResponse({
        reply:
          `Thank you for finding someone's belongings! To help return them safely:\n\n` +
          `1. Submit a **[Report Found](#report-found)** with the visible item appearance and campus location.\n` +
          `2. Keep private ownership details (such as lock screen codes or contents) secret so the true owner can prove ownership.\n` +
          `3. Drop it off at the **Campus Lost & Found Desk (Admin Block, Room 104)** for safe custody.`,
        matchedReports: [],
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: fallbackStatus,
        model: attemptedModel,
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: activeNote,
        startTime,
        reason: llmFallbackReason || undefined,
      });
    }

    // 13. General Search / Matched listings fallback
    if (matched.length > 0) {
      const topMatches = matched.slice(0, 5);
      const itemsList = topMatches
        .map((r, i) => {
          const typeBadge = r.reportType === "FOUND" ? "[FOUND ITEM]" : "[LOST ITEM]";
          const loc = r.approximateLocation ? ` at ${r.approximateLocation}` : "";
          const statusDesc = r.status === "RESOLVED" ? " (Resolved)" : r.status === "CLOSED" ? " (Closed)" : " (Open)";
          return `${i + 1}. ${typeBadge} **${r.title}** (${r.category})${loc}${statusDesc}`;
        })
        .join("\n");

      const actions = [ROUTE_ACTIONS.browse, ROUTE_ACTIONS.report_lost, ROUTE_ACTIONS.report_found];

      return createResponse({
        reply:
          `I found ${matched.length} report(s) matching your inquiry in **${commName}**:\n\n${itemsList}\n\n` +
          `You can browse, filter, or claim any open item directly in **[Campus Listings](#browse)**.`,
        matchedReports: topMatches,
        actions,
        action: actions[0],
        provider: "deterministic-retrieval",
        status: fallbackStatus,
        model: attemptedModel,
        communityId: commId,
        communityName: commName,
        configuredModel: false,
        note: activeNote,
        startTime,
        reason: llmFallbackReason || undefined,
      });
    }

    // 14. Default fallback when no tokens matched and no specific intent was detected
    const defaultActions = [ROUTE_ACTIONS.browse, ROUTE_ACTIONS.report_lost, ROUTE_ACTIONS.report_found];
    return createResponse({
      reply:
        `I searched active public reports in **${commName}**, but did not find any items matching "${trimmed}".\n\n` +
        `**Helpful Options:**\n` +
        `• Check **[Campus Listings](#browse)** to browse all categories (Electronics, Bags, Wallets, IDs, Keys).\n` +
        `• If you lost an item, submit a new listing via **[Report Lost](#report-lost)**.\n` +
        `• If you found an item on campus, log it via **[Report Found](#report-found)**.`,
      matchedReports: [],
      actions: defaultActions,
      action: defaultActions[0],
      provider: "deterministic-retrieval",
      status: fallbackStatus,
      model: attemptedModel,
      communityId: commId,
      communityName: commName,
      configuredModel: false,
      note: activeNote,
      startTime,
      reason: llmFallbackReason || undefined,
    });
  }

  private async invokeOptionalLLM(
    userMessage: string,
    publicReports: PublicReportItem[],
    communityName: string,
    history: ChatHistoryItem[] = []
  ): Promise<{
    reply: string | null;
    provider: "gemini";
    status: ChatProviderStatus;
    model: string;
    errorReason?: string;
  }> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.includes("replace-")) {
      return {
        reply: null,
        provider: "gemini",
        status: "unconfigured",
        model: "none",
        errorReason: "GEMINI_API_KEY is not configured in environment.",
      };
    }

    // 1. Check if an explicit model was requested
    const requestedModel = (process.env.GEMINI_MODEL || "").trim();

    // Prevent calling known shut-down / retired models
    if (requestedModel && SHUTDOWN_MODELS.has(requestedModel)) {
      return {
        reply: null,
        provider: "gemini",
        status: "unavailable_model",
        model: requestedModel,
        errorReason: `Configured model '${requestedModel}' has been shut down and is no longer available.`,
      };
    }

    let selectedModel = requestedModel;

    // 2. If no model explicitly configured, dynamically resolve active models from API key
    if (!selectedModel) {
      const discovery = await this.getAvailableGeminiModels(geminiKey);
      if (discovery.errorCategory === "invalid_key" || discovery.errorCategory === "quota") {
        return {
          reply: null,
          provider: "gemini",
          status: discovery.errorCategory,
          model: "none",
          errorReason: discovery.errorMessage || "Failed to query available models.",
        };
      }

      if (discovery.models.length > 0) {
        // Prioritize confirmed active models (gemini-3.8-flash, 3.5-flash-lite, etc.)
        selectedModel = selectBestAvailableModel(discovery.models);
      } else if (discovery.errorCategory === "unavailable_model") {
        return {
          reply: null,
          provider: "gemini",
          status: "unavailable_model",
          model: "none",
          errorReason: discovery.errorMessage || "No active supported models available for this API key.",
        };
      }

      // If discovery had an unexpected network error or was unmocked, default to active general-purpose model
      if (!selectedModel) {
        selectedModel = "gemini-2.5-flash";
      }
    }

    // PRIVACY BOUNDARY: Strictly public report metadata only
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
      `You are Milap.ai, the campus lost and found assistant for e-Milap at ${communityName}.\n` +
      `Your role is to guide students and staff through lost and found recovery.\n\n` +
      `Guidelines:\n` +
      `1. Use real e-Milap routes as markdown links:\n` +
      `   - [Report Lost](#report-lost)\n` +
      `   - [Report Found](#report-found)\n` +
      `   - [Campus Listings](#browse)\n` +
      `   - [Possible Matches](#matches)\n` +
      `   - [Ownership Claims](#claims)\n` +
      `   - [Updates & Alerts](#updates)\n` +
      `   - [Moderation Panel](#moderation)\n` +
      `   - [Account Settings](#settings)\n` +
      `   - [Dashboard](#overview)\n` +
      `2. If a user asks about an item without specifying whether they lost it or found it, ask a short clarifying question ("Did you lose this item, or did you find it?") and link both [Report Lost](#report-lost) and [Report Found](#report-found).\n` +
      `3. If the user asks a follow-up question (e.g. "where do I report it?"), use the conversation history to determine whether they lost or found the item.\n` +
      `4. Only discuss items present in the provided context data. Never hallucinate reports not listed.\n` +
      `5. You cannot perform actions directly (cannot submit claims, edit reports, or approve items). Always direct users to the appropriate interface links.\n` +
      `6. PRIVACY & SAFETY: Never ask for or expose private clues, passwords, session tokens, or personal identifiers. Inform users that private clues are encrypted with AES-256-GCM and verified during claims review.\n` +
      `Campus Desk: Admin Building, Room 104, Mon-Fri 8:30 AM - 5:30 PM.\n` +
      `Active Public Reports Context: ${JSON.stringify(publicContext)}`;

    // Build multi-turn contents array
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    // Prior history (up to last 6 messages)
    for (const h of history.slice(-6)) {
      const role = h.role === "assistant" || h.role === "bot" || h.role === "model" ? "model" : "user";
      contents.push({
        role,
        parts: [{ text: h.content }],
      });
    }

    // Current turn with system instruction prepended to first turn or user prompt
    const currentTurnText =
      contents.length === 0
        ? `${systemPrompt}\n\nUser Question: ${userMessage}`
        : `User Question: ${userMessage}`;

    contents.push({
      role: "user",
      parts: [{ text: currentTurnText }],
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const payload: any = {
        contents,
        generationConfig: { maxOutputTokens: 350, temperature: 0.2 },
      };

      if (contents.length > 1) {
        payload.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (res.status === 404) {
        return {
          reply: null,
          provider: "gemini",
          status: "unavailable_model",
          model: selectedModel,
          errorReason: `Model '${selectedModel}' was not found or has been retired for this API key project (HTTP 404).`,
        };
      }

      if (res.status === 429) {
        return {
          reply: null,
          provider: "gemini",
          status: "quota",
          model: selectedModel,
          errorReason: "Gemini API free-tier quota limit reached (HTTP 429).",
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          reply: null,
          provider: "gemini",
          status: "invalid_key",
          model: selectedModel,
          errorReason: `Gemini API authentication failed (HTTP ${res.status}). Verify GEMINI_API_KEY.`,
        };
      }

      if (!res.ok) {
        return {
          reply: null,
          provider: "gemini",
          status: "unavailable_model",
          model: selectedModel,
          errorReason: `Gemini API returned HTTP status ${res.status}.`,
        };
      }

      const data: any = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === "string" && text.trim().length > 0) {
        return {
          reply: text.trim(),
          provider: "gemini",
          status: "success",
          model: selectedModel,
        };
      }

      return {
        reply: null,
        provider: "gemini",
        status: "unavailable_model",
        model: selectedModel,
        errorReason: "Gemini API returned an empty response.",
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          reply: null,
          provider: "gemini",
          status: "timeout",
          model: selectedModel,
          errorReason: "Gemini API request timed out (3.5s limit).",
        };
      }
      return {
        reply: null,
        provider: "gemini",
        status: "network_error",
        model: selectedModel,
        errorReason: "Network error communicating with Gemini API.",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getAvailableGeminiModels(
    apiKey: string
  ): Promise<{ models: string[]; errorCategory?: ChatProviderStatus; errorMessage?: string }> {
    const now = Date.now();
    if (ChatService.cachedAvailableModels && now - ChatService.cachedAvailableModels.timestamp < 15 * 60 * 1000) {
      return { models: ChatService.cachedAvailableModels.list };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.status === 401 || res.status === 403) {
        return {
          models: [],
          errorCategory: "invalid_key",
          errorMessage: `Gemini API authentication failed (HTTP ${res.status}). Verify GEMINI_API_KEY.`,
        };
      }

      if (res.status === 429) {
        return {
          models: [],
          errorCategory: "quota",
          errorMessage: "Gemini API quota limit reached (HTTP 429).",
        };
      }

      if (!res.ok) {
        return {
          models: [],
          errorCategory: "unavailable_model",
          errorMessage: `Failed to retrieve available models list (HTTP ${res.status}).`,
        };
      }

      const data: any = await res.json();
      if (Array.isArray(data?.models)) {
        const list = data.models
          .filter(
            (m: any) =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes("generateContent")
          )
          .map((m: any) => String(m.name || "").replace(/^models\//, ""))
          .filter((name: string) => Boolean(name) && !SHUTDOWN_MODELS.has(name));

        ChatService.cachedAvailableModels = { list, timestamp: now };
        return { models: list };
      }

      return {
        models: [],
        errorCategory: "unavailable_model",
        errorMessage: "No models returned from Google AI Studio.",
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          models: [],
          errorCategory: "timeout",
          errorMessage: "Model discovery request timed out (2.5s limit).",
        };
      }
      return {
        models: [],
        errorCategory: "network_error",
        errorMessage: "Network error reaching Gemini model discovery.",
      };
    }
  }
}

export const chatService = new ChatService();
