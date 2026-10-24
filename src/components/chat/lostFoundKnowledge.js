// Knowledge base and intent-matching constants for eMilap Campus Lost & Found

export const QUICK_QUERIES = [
  { id: 'report_lost', label: 'How do I report a lost item?' },
  { id: 'report_found', label: 'I found something on campus' },
  { id: 'verification', label: 'How does ownership claim work?' },
  { id: 'location', label: 'Where is the Lost & Found office?' },
  { id: 'retention', label: 'How long are items kept?' },
  { id: 'matches', label: 'How do automatic matches work?' },
];

export const TOPIC_RESPONSES = {
  report_lost: {
    title: 'Reporting a Lost Item',
    content: `To report a lost item on eMilap:
1. Click **"Report Lost"** in the navigation or select [Report Lost](#report-lost).
2. Provide a descriptive title (e.g., "Navy Blue Herschel Backpack", "Matte Black AirPods Pro").
3. Select the approximate date, time, and campus zone where you last saw it (Library, Cafeteria, Science Block, Quad).
4. Add distinctive identifying marks (scratches, stickers, keychains).
5. Once submitted, our system will automatically scan for matching "Found" listings and notify you!`,
    suggestedAction: { label: 'Go to Report Lost Form', view: 'report_lost', url: '#report-lost' },
  },

  report_found: {
    title: 'Reporting a Found Item',
    content: `Thank you for being a good campus citizen! Here's what to do:
1. Open **"Report Found"** or click [Report Found](#report-found) and submit the item details with the campus zone where you found it.
2. **Privacy Tip:** Keep private identification details hidden (like phone lockscreen photos, wallet contents, or serial numbers). These will serve as proof when the true owner claims it.
3. You can either hold the item temporarily or deposit it at the **Campus Lost & Found Desk (Admin Block, Rm 104)** for safe custody.`,
    suggestedAction: { label: 'Go to Report Found Form', view: 'report_found', url: '#report-found' },
  },

  verification: {
    title: 'Ownership Verification & Claims',
    content: `To ensure items are returned only to their rightful owners:
• Anyone claiming an item must submit an **Ownership Claim** via [Campus Listings](#browse).
• Claimants must answer challenge questions: e.g., device passcode demonstration, describing non-public contents, showing proof of purchase, or student ID confirmation.
• Once approved by campus moderators or the founder, safe in-person handover coordinates are arranged.`,
    suggestedAction: { label: 'View Ownership Claims', view: 'claims', url: '#claims' },
  },

  location: {
    title: 'Campus Lost & Found Desk & Hours',
    content: `📍 **Central Drop-off & Collection Desk:**
• **Location:** Administration Building, Ground Floor, Room 104 (Next to Student Services)
• **Operating Hours:**
  – Monday to Friday: 8:30 AM – 5:30 PM
  – Saturday: 9:00 AM – 1:00 PM
  – Sunday & Campus Holidays: Closed
• **Helpline:** Ext. 4421 / security@campus.edu`,
    suggestedAction: { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
  },

  retention: {
    title: 'Storage & Retention Policy',
    content: `Campus policy on unclaimed items:
• **High-Value Items** (Laptops, smartphones, tablets, official IDs): Securely kept in the office safe for **one full academic semester (up to 120 days)**.
• **General Items** (Clothing, water bottles, umbrellas, notebooks): Held for **60 days**.
• **Unclaimed Property:** Items not claimed after the retention window are donated to campus community initiatives or recycled responsibly.`,
    suggestedAction: { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
  },

  matches: {
    title: 'Automated Match Engine',
    content: `How eMilap connects lost and found reports:
• Our system constantly compares new reports by **Category**, **Location Zone**, **Date Range**, and **Key Descriptors**.
• When similarity is high, the item shows under **"Possible Matches"** for both reporter and founder to review without exposing personal contact details.`,
    suggestedAction: { label: 'Explore Possible Matches', view: 'matches', url: '#matches' },
  },

  ids_cards: {
    title: 'Lost Student ID or Bank Cards',
    content: `Lost an ID or Bank Card?
1. Check the **Campus Security Desk** immediately — found student cards are often handed in within hours.
2. Submit a quick **Report Lost** so security can cross-reference card numbers.
3. Remember to temporarily freeze any lost bank cards via your banking app as a precaution.`,
    suggestedAction: { label: 'Report Lost Card', view: 'report_lost', url: '#report-lost' },
  },

  moderation: {
    title: 'Trust & Moderation Standards',
    content: `eMilap operates with verified campus community oversight:
• All reports are reviewed to prevent duplicate spam or fraudulent listings.
• Handover transfers should always happen in well-lit public campus spots or at the Security Helpdesk.
• Never pay fees or send money to reclaim an item — eMilap is 100% free for the campus.`,
    suggestedAction: { label: 'Open Moderation Panel', view: 'admin', url: '#moderation' },
  },
};

// Common physical campus items
const COMMON_ITEMS_REGEX = /\b(bag|backpack|wallet|purse|keys|keychain|phone|iphone|android|laptop|macbook|charger|airpods|earphones|headphones|water bottle|bottle|calculator|glasses|sunglasses|jacket|hoodie|umbrella|id|card|watch|notebook|ring|necklace)\b/i;

// Intent keyword rules specific to Lost & Found
export function matchLostFoundQuery(rawInput, history = []) {
  const query = rawInput.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|greetings|help|good morning|good afternoon|good evening|howdy|sup|yo)\b/i.test(query)) {
    const actions = [
      { label: 'Report Lost Item', view: 'report_lost', url: '#report-lost' },
      { label: 'Report Found Item', view: 'report_found', url: '#report-found' },
      { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
    ];
    return {
      text: "Hello! 👋 I'm **Milap.ai**, your campus lost & found assistant.\n\nI can help you report lost or found belongings, search campus listings, understand ownership verification, or locate the campus desk. Select an action below or ask any question!",
      action: actions[0],
      actions,
      quickQueries: true,
    };
  }

  // 2. Follow-up query context resolution (e.g. "where do I report it?", "how to submit")
  if (
    query.includes("where do i report") ||
    query.includes("how do i report") ||
    query.includes("how to report it") ||
    query.includes("where to report") ||
    query.includes("what should i do next")
  ) {
    if (history && history.length > 0) {
      const pastUserMessages = history.filter((h) => h.role === "user").map((h) => h.content.toLowerCase());
      const pastContext = pastUserMessages.join(" ");

      const wasLost = pastContext.includes("lost") || pastContext.includes("missing") || pastContext.includes("misplaced");
      const wasFound = pastContext.includes("found") || pastContext.includes("picked up");

      if (wasLost && !wasFound) {
        return {
          text: TOPIC_RESPONSES.report_lost.content,
          action: TOPIC_RESPONSES.report_lost.suggestedAction,
          actions: [TOPIC_RESPONSES.report_lost.suggestedAction, { label: 'Browse Campus Listings', view: 'browse', url: '#browse' }],
        };
      }
      if (wasFound && !wasLost) {
        return {
          text: TOPIC_RESPONSES.report_found.content,
          action: TOPIC_RESPONSES.report_found.suggestedAction,
          actions: [TOPIC_RESPONSES.report_found.suggestedAction, { label: 'Browse Campus Listings', view: 'browse', url: '#browse' }],
        };
      }
    }
    // Generic fallback if no prior context
    return {
      text: "To file a report on eMilap:\n• If you lost an item, open [Report Lost](#report-lost).\n• If you found someone's belongings, open [Report Found](#report-found).",
      action: TOPIC_RESPONSES.report_lost.suggestedAction,
      actions: [TOPIC_RESPONSES.report_lost.suggestedAction, TOPIC_RESPONSES.report_found.suggestedAction],
    };
  }

  const hasLostWord = /\b(lost|misplaced|missing|forgot|dropped|left behind|can't find|lost my|where is my)\b/i.test(query);
  const hasFoundWord = /\b(found|discovered|picked up|turned in|someone left|hand over|deposit)\b/i.test(query);

  // 3. Ambiguity Resolution: User mentions an item without indicating whether lost or found
  if (COMMON_ITEMS_REGEX.test(query) && !hasLostWord && !hasFoundWord) {
    const actions = [
      { label: 'I Lost This', view: 'report_lost', url: '#report-lost' },
      { label: 'I Found This', view: 'report_found', url: '#report-found' },
      { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
    ];
    return {
      text: `Did you **lose** this item, or did you **find** it on campus?\n\n` +
        `• **If you lost it:** Click **[Report Lost](#report-lost)** so we can search for matches and alert you when someone turns it in.\n` +
        `• **If you found it:** Click **[Report Found](#report-found)** or deposit it at the Campus Desk (Admin Block 104) to help the owner recover it.\n` +
        `• You can also explore existing records in **[Campus Listings](#browse)**.`,
      action: actions[0],
      actions,
    };
  }

  // 4. Report Lost keywords
  if (hasLostWord) {
    const actions = [
      TOPIC_RESPONSES.report_lost.suggestedAction,
      { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
      { label: 'Check Possible Matches', view: 'matches', url: '#matches' },
    ];
    return {
      text: TOPIC_RESPONSES.report_lost.content,
      action: TOPIC_RESPONSES.report_lost.suggestedAction,
      actions,
    };
  }

  // 5. Report Found keywords
  if (hasFoundWord) {
    const actions = [
      TOPIC_RESPONSES.report_found.suggestedAction,
      { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
    ];
    return {
      text: TOPIC_RESPONSES.report_found.content,
      action: TOPIC_RESPONSES.report_found.suggestedAction,
      actions,
    };
  }

  // 6. Verification & Claims
  if (/\b(claim|ownership|verify|proof|prove|confirm owner|challenge|handover|pickup code)\b/i.test(query)) {
    const actions = [
      TOPIC_RESPONSES.verification.suggestedAction,
      { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
    ];
    return {
      text: TOPIC_RESPONSES.verification.content,
      action: TOPIC_RESPONSES.verification.suggestedAction,
      actions,
    };
  }

  // 7. Location, Hours, Desk
  if (/\b(where|location|office|room|desk|hours|time|timing|admin block|address|contact|phone|number|call|building)\b/i.test(query)) {
    const actions = [
      { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
      { label: 'Report Found Item', view: 'report_found', url: '#report-found' },
    ];
    return {
      text: TOPIC_RESPONSES.location.content,
      action: actions[0],
      actions,
    };
  }

  // 8. Retention, expiry, donate
  if (/\b(how long|retention|keep|store|time limit|expire|donate|auction|throw away|semester)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.retention.content,
      action: TOPIC_RESPONSES.retention.suggestedAction,
      actions: [TOPIC_RESPONSES.retention.suggestedAction],
    };
  }

  // 9. Matching algorithm
  if (/\b(match|matching|algorithm|compare|similarity|notification|status)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.matches.content,
      action: TOPIC_RESPONSES.matches.suggestedAction,
      actions: [TOPIC_RESPONSES.matches.suggestedAction, { label: 'Browse Campus Listings', view: 'browse', url: '#browse' }],
    };
  }

  // 10. IDs and Cards
  if (/\b(id|card|student id|smart card|wallet|license|atm|debit|credit)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.ids_cards.content,
      action: TOPIC_RESPONSES.ids_cards.suggestedAction,
      actions: [TOPIC_RESPONSES.ids_cards.suggestedAction, { label: 'Browse Campus Listings', view: 'browse', url: '#browse' }],
    };
  }

  // 11. Moderation / safety / fees
  if (/\b(scam|fraud|money|fee|safe|moderator|admin|report user|fake)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.moderation.content,
      action: TOPIC_RESPONSES.moderation.suggestedAction,
      actions: [TOPIC_RESPONSES.moderation.suggestedAction],
    };
  }

  // 12. Listings / Browse
  if (/\b(browse|list|listings|all items|catalog|search)\b/i.test(query)) {
    const actions = [
      { label: 'Open Campus Listings', view: 'browse', url: '#browse' },
      { label: 'Report Lost Item', view: 'report_lost', url: '#report-lost' },
      { label: 'Report Found Item', view: 'report_found', url: '#report-found' },
    ];
    return {
      text: `You can view all current campus listings in **[Campus Listings](#browse)**. Use the search and category filters to locate items turned in across campus zones.`,
      action: actions[0],
      actions,
    };
  }

  // Off-topic constraint: Strictly refuse non-lost-and-found queries
  const fallbackActions = [
    { label: 'Report Lost Item', view: 'report_lost', url: '#report-lost' },
    { label: 'Report Found Item', view: 'report_found', url: '#report-found' },
    { label: 'Browse Campus Listings', view: 'browse', url: '#browse' },
  ];
  return {
    isOffTopic: true,
    text: `I am **Milap.ai**, specifically designed to assist with campus lost and found topics only.\n\n` +
      `Please ask about:\n` +
      `• Reporting a lost or found item\n` +
      `• Claiming and proving ownership\n` +
      `• Campus desk location and collection hours\n` +
      `• Search & matching procedures`,
    action: fallbackActions[0],
    actions: fallbackActions,
    quickQueries: true,
  };
}
