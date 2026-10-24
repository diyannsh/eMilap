// Deterministic matcher — works without AI service. Optional embeddings added later (M8).
// Weights from blueprint Part 1 / Architecture: description 35%, category 20%, attributes 15%, time 15%, location 15%.

export interface ScoreBreakdown {
  descriptionSimilarity: number;
  categoryCompatibility: number;
  sharedAttributes: number;
  timeCompatibility: number;
  locationCompatibility: number;
  total: number;
}

export function calculateDeterministicScore(
  reportA: { category: string; title: string; publicDescription: string; approximateLocation?: string; occurredAt?: string },
  reportB: { category: string; title: string; publicDescription: string; approximateLocation?: string; occurredAt?: string },
): ScoreBreakdown {
  // Placeholder deterministic signals (normalized to 0-100 scale)
  const categoryMatch = reportA.category === reportB.category ? 1 : 0;
  const titleOverlap = (reportA.title || "").toLowerCase().split(/\s+/).filter(w => (reportB.title || "").toLowerCase().includes(w)).length;
  const descOverlap = (reportA.publicDescription || "").toLowerCase().includes((reportB.publicDescription || "").toLowerCase().slice(0, 20)) ? 0.5 : 0;

  const total =
    Math.round(titleOverlap * 35 + categoryMatch * 20 + 15 + 15 + 15); // simplified placeholder

  return {
    descriptionSimilarity: Math.round(titleOverlap * 35),
    categoryCompatibility: Math.round(categoryMatch * 20),
    sharedAttributes: 15,
    timeCompatibility: 15,
    locationCompatibility: 15,
    total: total,
  };
}
