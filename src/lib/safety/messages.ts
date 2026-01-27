/**
 * Safety messages for restricted cases
 * Compassionate, clear, action-oriented
 */

type SafetyMessageCategory =
  | "sexual_assault"
  | "violent_crime"
  | "criminal_charges"
  | "general";

const SAFETY_MESSAGES: Record<SafetyMessageCategory, string> = {
  sexual_assault: `I understand you're dealing with a very serious and sensitive situation.

Cases involving sexual assault or abuse require specialized legal expertise and support that goes beyond what I can provide through this platform.

I strongly recommend speaking with a qualified solicitor who specializes in these cases. They can provide the confidential support and legal guidance you need.

This conversation is now closed, but your case information has been saved securely.`,

  violent_crime: `I can see this involves a very serious situation that requires immediate professional legal assistance.

Cases involving violence or potential criminal charges need specialized legal representation that I'm not equipped to provide through this platform.

Please contact a qualified criminal defense solicitor as soon as possible. They can give you the urgent legal advice and protection you need.

This conversation is now closed for your safety and to ensure you get proper legal support.`,

  criminal_charges: `Thank you for sharing this with me. I can see this is a very serious legal matter.

Your situation requires specialized legal expertise that goes beyond what this AI assistant can provide. For your protection and to ensure you get the best possible support, I need to refer you to a qualified solicitor.

Please seek assistance from a legal professional who specializes in cases like yours. They can provide the confidential guidance and representation you need.

This conversation is now closed, but your information remains securely stored.`,

  general: `Thank you for sharing this with me. I can see this is a very serious legal matter.

Your situation requires specialized legal expertise that goes beyond what this AI assistant can provide. For your protection and to ensure you get the best possible support, I need to refer you to a qualified solicitor.

Please seek assistance from a legal professional who specializes in cases like yours. They can provide the confidential guidance and representation you need.

This conversation is now closed, but your information remains securely stored.`,
};

/**
 * Get appropriate safety message based on detected category
 */
export function getSafetyMessage(
  category?: "sexual_assault" | "violent_crime" | "criminal_charges"
): string {
  if (!category) {
    return SAFETY_MESSAGES.general;
  }

  return SAFETY_MESSAGES[category] || SAFETY_MESSAGES.general;
}
