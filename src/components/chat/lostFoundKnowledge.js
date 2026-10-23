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
1. Click **"Report Lost"** in the top navigation or home screen.
2. Provide a descriptive title (e.g., "Navy Blue Herschel Backpack", "Matte Black AirPods Pro").
3. Select the approximate date, time, and campus zone where you last saw it (Library, Cafeteria, Science Block, Quad).
4. Add distinctive identifying marks (scratches, stickers, keychains).
5. Once submitted, our system will automatically scan for matching "Found" listings and notify you!`,
    suggestedAction: { label: 'Go to Report Lost Form', view: 'report_lost' },
  },

  report_found: {
    title: 'Reporting a Found Item',
    content: `Thank you for being a good campus citizen! Here's what to do:
1. Open **"Report Found"** and submit the item details with the location you found it.
2. **Privacy Tip:** Keep private identification details hidden (like phone lockscreen photos, wallet contents, or serial numbers). These will serve as proof when the true owner claims it.
3. You can either hold the item temporarily or deposit it at the **Campus Lost & Found Desk (Admin Block, Rm 104)** for safe custody.`,
    suggestedAction: { label: 'Go to Report Found Form', view: 'report_found' },
  },

  verification: {
    title: 'Ownership Verification & Claims',
    content: `To ensure items are returned only to their rightful owners:
• Anyone claiming an item must submit an **Ownership Claim**.
• Claimants must answer challenge questions: e.g., device passcode demonstration, describing non-public contents, showing proof of purchase, or student ID confirmation.
• Once approved by campus moderators or the founder, safe in-person handover coordinates are arranged.`,
    suggestedAction: { label: 'View Ownership Claims', view: 'claims' },
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
  },

  retention: {
    title: 'Storage & Retention Policy',
    content: `Campus policy on unclaimed items:
• **High-Value Items** (Laptops, smartphones, tablets, official IDs): Securely kept in the office safe for **one full academic semester (up to 120 days)**.
• **General Items** (Clothing, water bottles, umbrellas, notebooks): Held for **60 days**.
• **Unclaimed Property:** Items not claimed after the retention window are donated to campus community initiatives or recycled responsibly.`,
  },

  matches: {
    title: 'Automated Match Engine',
    content: `How eMilap connects lost and found reports:
• Our system constantly compares new reports by **Category**, **Location Zone**, **Date Range**, and **Key Descriptors**.
• When similarity is high, the item shows under **"Possible Matches"** for both reporter and founder to review without exposing personal contact details.`,
    suggestedAction: { label: 'Explore Possible Matches', view: 'matches' },
  },

  ids_cards: {
    title: 'Lost Student ID or Bank Cards',
    content: `Lost an ID or Bank Card?
1. Check the **Campus Security Desk** immediately — found student cards are often handed in within hours.
2. Submit a quick **Report Lost** so security can cross-reference card numbers.
3. Remember to temporarily freeze any lost bank cards via your banking app as a precaution.`,
    suggestedAction: { label: 'Browse Listings', view: 'browse' },
  },

  moderation: {
    title: 'Trust & Moderation Standards',
    content: `eMilap operates with verified campus community oversight:
• All reports are reviewed to prevent duplicate spam or fraudulent listings.
• Handover transfers should always happen in well-lit public campus spots or at the Security Helpdesk.
• Never pay fees or send money to reclaim an item — eMilap is 100% free for the campus.`,
  },
};

// Intent keyword rules specific to Lost & Found
export function matchLostFoundQuery(rawInput) {
  const query = rawInput.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|greetings|help|good morning|good afternoon|good evening|yo)\b/i.test(query)) {
    return {
      text: "Hello! 👋 I'm **Milap.ai**, your campus lost & found assistant. I can help you report lost or found belongings, understand ownership verification, or locate the campus desk. Select a quick query below or ask anything about campus lost & found!",
      quickQueries: true,
    };
  }

  // Report Lost keywords
  if (/\b(lost|misplaced|missing|forgot|dropped|left behind|can't find|lost my|where is my)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.report_lost.content,
      action: TOPIC_RESPONSES.report_lost.suggestedAction,
    };
  }

  // Report Found keywords
  if (/\b(found|discovered|picked up|turned in|someone left|hand over|deposit)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.report_found.content,
      action: TOPIC_RESPONSES.report_found.suggestedAction,
    };
  }

  // Verification & Claims
  if (/\b(claim|ownership|verify|proof|prove|confirm owner|challenge|handover|pickup code)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.verification.content,
      action: TOPIC_RESPONSES.verification.suggestedAction,
    };
  }

  // Location, Hours, Desk
  if (/\b(where|location|office|room|desk|hours|time|timing|admin block|address|contact|phone|number|call|building)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.location.content,
    };
  }

  // Retention, expiry, donate
  if (/\b(how long|retention|keep|store|time limit|expire|donate|auction|throw away|semester)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.retention.content,
    };
  }

  // Matching algorithm
  if (/\b(match|matching|algorithm|compare|similarity|notification|status)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.matches.content,
      action: TOPIC_RESPONSES.matches.suggestedAction,
    };
  }

  // IDs and Cards
  if (/\b(id|card|student id|smart card|wallet|license|atm|debit|credit)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.ids_cards.content,
      action: TOPIC_RESPONSES.ids_cards.suggestedAction,
    };
  }

  // Moderation / safety / fees
  if (/\b(scam|fraud|money|fee|safe|moderator|admin|report user|fake)\b/i.test(query)) {
    return {
      text: TOPIC_RESPONSES.moderation.content,
    };
  }

  // Listings / Browse
  if (/\b(browse|list|listings|all items|catalog|search)\b/i.test(query)) {
    return {
      text: `You can view all current campus listings in the **Campus Listings** section. Use the search and category filters to locate items turned in across campus zones.`,
      action: { label: 'Open Campus Listings', view: 'browse' },
    };
  }

  // Off-topic constraint: Strictly refuse non-lost-and-found queries
  return {
    isOffTopic: true,
    text: `I am **Milap.ai**, specifically designed to assist with campus lost and found topics only. 

I cannot answer general trivia, coding, or unrelated queries. Please ask about:
• Reporting a lost or found item
• Claiming and proving ownership
• Campus desk location and collection hours
• Search & matching procedures`,
    quickQueries: true,
  };
}

