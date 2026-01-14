const PROFANITY = ['slur1', 'slur2', 'slur3'];

const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_REGEX = /\+?\d[\d\s-]{7,}\d/g;

export function sanitizeText(text: string): string {
  let sanitized = text.replace(EMAIL_REGEX, '[redacted]');
  sanitized = sanitized.replace(PHONE_REGEX, '[redacted]');

  for (const word of PROFANITY) {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  return sanitized.trim();
}

export function filterDialogueSeeds(seeds: string[]): string[] {
  const filtered = seeds
    .map((seed) => sanitizeText(seed))
    .filter((seed) => seed.length > 0);

  return filtered.length > 0 ? filtered : ['gm', 'portfolio check', 'market vibes'];
}
