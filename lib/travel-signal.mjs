// Deterministic travel metadata from text already supplied by a job provider.
// This module never fetches descriptions and never scores suitability.

const HIGH = [
  /\b(?:extensive|frequent|regular)\s+(?:international\s+|overseas\s+|business\s+)?travel\b/iu,
  /\btravel\s+(?:extensively|frequently|regularly)\b/iu,
  /\b(?:regular|frequent)\s+(?:international\s+|overseas\s+)?assignments?\s+(?:abroad|overseas|internationally)\b/iu,
  /\b(?:regular|frequent)\s+overseas\s+assignments?\b/iu,
  /\b(?:[5-9]\d|100)\s*%\s*(?:of\s+)?(?:business\s+)?travel\b/iu,
  /\b(?:[5-9]\d|100)\s+percent\s+(?:business\s+)?travel\b/iu,
  /\btravel\s+(?:up\s+to\s+)?(?:[5-9]\d|100)\s*(?:%|percent)\b/iu,
];
const MODERATE = [
  /\b(?:[0-4]?\d)\s*%\s*(?:of\s+)?(?:business\s+)?travel\b/iu,
  /\b(?:[0-4]?\d)\s+percent\s+(?:business\s+)?travel\b/iu,
  /\btravel\s+(?:up\s+to\s+)?(?:[0-4]?\d)\s*(?:%|percent)\b/iu,
];
const LOW = [
  /\b(?:no|zero|without)\s+(?:business\s+)?travel\b/iu,
  /\b(?:minimal|rare|infrequent|occasional)\s+(?:business\s+)?travel\b/iu,
  /\bno\s+travel\s+required\b/iu,
  /\btravel\s+(?:is\s+)?not\s+required\b/iu,
  /\boccasional\s+(?:(?:customer|client)[- ]site\s+)?on[- ]site\s+visits?\b/iu,
  /\boccasional\s+visits?\s+to\s+(?:customer|client)\s+sites\b/iu,
];

const SENTENCE = /[^.!?\n]+(?:[.!?]+|$)/gu;

function sentenceHas(sentence, patterns) {
  return patterns.some((pattern) => pattern.test(sentence));
}

/** @param {unknown} description */
export function classifyTravel(description) {
  if (typeof description !== 'string' || !description.trim()) {
    return { level: 'Unknown', evidence: [] };
  }

  const sentences = description.match(SENTENCE) ?? [description];
  const evidence = [];
  let level = 'Unknown';
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    // A negated frequency statement does not establish another frequency.
    // Direct statements that travel is not required are explicitly Low below.
    const negatesFrequency = /\b(?:frequent|extensive|regular|occasional|periodic)\s+(?:international\s+|overseas\s+|business\s+)?travel\b[^.!?]{0,40}\b(?:not\s+required|not\s+expected|not\s+necessary)\b/iu.test(sentence)
      || /\b(?:not\s+required|not\s+expected|not\s+necessary)\b[^.!?]{0,40}\b(?:frequent|extensive|regular|occasional|periodic)\s+travel\b/iu.test(sentence);
    if (negatesFrequency) continue;

    const positive = sentenceHas(sentence, HIGH) || sentenceHas(sentence, MODERATE);
    const explicitlyLow = sentenceHas(sentence, LOW);
    const negatesTravel = /\b(?:no|not|never|without)\b[^.!?]{0,60}\b(?:travel|travelling|traveling)\b/iu.test(sentence)
      || /\b(?:travel|travelling|traveling)\b[^.!?]{0,35}\b(?:not required|not expected|not necessary|isn['’]?t required)\b/iu.test(sentence);
    if (positive && (explicitlyLow || negatesTravel)) continue;
    if (negatesTravel && !explicitlyLow) continue;

    if (sentenceHas(sentence, HIGH)) level = 'High';
    else if (sentenceHas(sentence, MODERATE) && level !== 'High') level = 'Moderate';
    else if (explicitlyLow && level === 'Unknown') level = 'Low';
    if (sentenceHas(sentence, HIGH) || sentenceHas(sentence, MODERATE) || explicitlyLow) evidence.push(sentence);
  }
  return { level, evidence: [...new Set(evidence)] };
}

/** Add travel metadata without changing discovery order or existing job fields. */
export function annotateTravel(jobs) {
  return jobs.map((job) => ({ ...job, travel: classifyTravel(job.description) }));
}
