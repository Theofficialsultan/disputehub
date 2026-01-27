/**
 * Detect extreme cases that require professional legal assistance
 * Conservative approach - false positives acceptable for user safety
 */

type ExtremeCase = {
  detected: boolean;
  category?: "sexual_assault" | "violent_crime" | "criminal_charges";
};

// High-confidence keywords for extreme cases
const SEXUAL_ASSAULT_KEYWORDS = [
  "rape",
  "raped",
  "sexual assault",
  "sexually assaulted",
  "molest",
  "molestation",
  "molested",
  "sexual abuse",
  "indecent assault",
  "sexual violence",
  "non-consensual",
];

const VIOLENT_CRIME_KEYWORDS = [
  "murder",
  "killed",
  "homicide",
  "manslaughter",
  "stabbed",
  "shot at",
  "shot me",
  "attacked with",
  "tried to kill",
  "attempted murder",
  "domestic violence",
  "kidnapping",
  "abduction",
];

const CRIMINAL_CHARGES_KEYWORDS = [
  "charged with murder",
  "charged with rape",
  "charged with assault",
  "facing criminal charges",
  "criminal prosecution",
  "arrested for",
  "indicted for",
  "felony charges",
];

// Phrase patterns for context verification
const SEXUAL_ASSAULT_PATTERNS = [
  /\b(was|been|got)\s+(raped|sexually assaulted)\b/i,
  /\b(rape|sexual assault)\s+(victim|survivor)\b/i,
  /(forced|coerced)\s+(me|them)\s+to/i,
  /\bunwanted sexual\b/i,
];

const VIOLENT_CRIME_PATTERNS = [
  /\b(tried to|attempted to|going to)\s+kill\b/i,
  /\battacked\s+(me|us|them)\s+with\b/i,
  /\b(fear|feared)\s+for\s+(my|our|their)\s+(life|safety)\b/i,
  /\b(stabbed|shot|beaten)\s+(me|us|him|her)\b/i,
];

const CRIMINAL_CHARGES_PATTERNS = [
  /\bcharged with\s+(murder|rape|assault|manslaughter)\b/i,
  /\barrested for\s+/i,
  /\bfacing\s+(criminal|felony)\s+charges\b/i,
  /\bpolice\s+(are|have)\s+investigating\s+me\b/i,
];

/**
 * Detect sexual assault or abuse cases
 */
function detectSexualAssault(content: string): boolean {
  const normalized = content.toLowerCase();

  // Check keywords
  const hasKeyword = SEXUAL_ASSAULT_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );

  if (!hasKeyword) return false;

  // Verify context with patterns (reduces false positives)
  const hasPattern = SEXUAL_ASSAULT_PATTERNS.some((pattern) =>
    pattern.test(content)
  );

  // High confidence if both keyword and pattern match
  // Or just keyword for very explicit terms
  const explicitTerms = ["rape", "raped", "sexual assault"];
  const hasExplicitTerm = explicitTerms.some((term) =>
    normalized.includes(term)
  );

  return hasPattern || hasExplicitTerm;
}

/**
 * Detect violent crime cases
 */
function detectViolentCrime(content: string): boolean {
  const normalized = content.toLowerCase();

  // Check keywords
  const hasKeyword = VIOLENT_CRIME_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );

  if (!hasKeyword) return false;

  // Verify context
  const hasPattern = VIOLENT_CRIME_PATTERNS.some((pattern) =>
    pattern.test(content)
  );

  // High confidence terms
  const explicitTerms = ["murder", "tried to kill", "attempted murder"];
  const hasExplicitTerm = explicitTerms.some((term) =>
    normalized.includes(term)
  );

  return hasPattern || hasExplicitTerm;
}

/**
 * Detect serious criminal charges
 */
function detectCriminalCharges(content: string): boolean {
  const normalized = content.toLowerCase();

  // Check keywords
  const hasKeyword = CRIMINAL_CHARGES_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );

  if (!hasKeyword) return false;

  // Verify with patterns
  const hasPattern = CRIMINAL_CHARGES_PATTERNS.some((pattern) =>
    pattern.test(content)
  );

  return hasPattern;
}

/**
 * Main detection function
 * Runs ONLY on USER messages
 */
export function detectExtremeCase(content: string): ExtremeCase {
  // Sexual Assault Detection
  if (detectSexualAssault(content)) {
    return {
      detected: true,
      category: "sexual_assault",
    };
  }

  // Violent Crime Detection
  if (detectViolentCrime(content)) {
    return {
      detected: true,
      category: "violent_crime",
    };
  }

  // Criminal Charges Detection
  if (detectCriminalCharges(content)) {
    return {
      detected: true,
      category: "criminal_charges",
    };
  }

  return { detected: false };
}
