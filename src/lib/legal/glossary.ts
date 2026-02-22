/**
 * Feature 7: Legal Glossary
 * Tooltip explanations for legal terms
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
  shortDefinition: string;
  category: GlossaryCategory;
  relatedTerms: string[];
  example?: string;
  ukSpecific: boolean;
}

export type GlossaryCategory = 
  | "general"
  | "court"
  | "contracts"
  | "employment"
  | "property"
  | "data_protection"
  | "consumer"
  | "procedure";

// Comprehensive UK legal glossary
export const LEGAL_GLOSSARY: GlossaryTerm[] = [
  // General Legal Terms
  {
    term: "Claimant",
    definition: "The person or organisation who starts a court case. In civil cases, this is the person bringing the claim. Previously known as the 'plaintiff' in older terminology.",
    shortDefinition: "The person who starts a court case",
    category: "general",
    relatedTerms: ["Defendant", "Plaintiff", "Litigation"],
    ukSpecific: true,
  },
  {
    term: "Defendant",
    definition: "The person or organisation against whom a court case is brought. The defendant must respond to the claim within a specified time period.",
    shortDefinition: "The person being sued in a court case",
    category: "general",
    relatedTerms: ["Claimant", "Defence", "Litigation"],
    ukSpecific: false,
  },
  {
    term: "Letter Before Action",
    definition: "A formal letter sent to an opposing party before starting court proceedings. It outlines the claim, the legal basis, and gives the recipient a chance to resolve the matter without going to court. Also known as a 'Letter Before Claim' in some contexts.",
    shortDefinition: "A formal warning letter before starting court action",
    category: "procedure",
    relatedTerms: ["Pre-Action Protocol", "Claim", "Settlement"],
    example: "Before suing your landlord, you must send a Letter Before Action giving them 14 days to respond.",
    ukSpecific: true,
  },
  {
    term: "Pre-Action Protocol",
    definition: "Official rules that parties must follow before starting court proceedings. These protocols encourage early exchange of information and settlement. Failure to follow them can result in cost penalties.",
    shortDefinition: "Rules to follow before starting a court case",
    category: "procedure",
    relatedTerms: ["Letter Before Action", "Civil Procedure Rules"],
    ukSpecific: true,
  },
  {
    term: "Liability",
    definition: "Legal responsibility for something. In civil cases, this typically means responsibility for damages or losses. A person can be 'liable' (legally responsible) for their actions or omissions.",
    shortDefinition: "Legal responsibility for something",
    category: "general",
    relatedTerms: ["Negligence", "Damages", "Breach"],
    ukSpecific: false,
  },
  {
    term: "Damages",
    definition: "Money awarded by a court to compensate someone for loss or injury. Can include 'general damages' (non-monetary losses like pain and suffering) and 'special damages' (specific financial losses).",
    shortDefinition: "Money awarded as compensation",
    category: "general",
    relatedTerms: ["Compensation", "Liability", "Remedy"],
    ukSpecific: false,
  },
  {
    term: "Settlement",
    definition: "An agreement between parties to resolve a dispute without completing court proceedings. Settlements are usually 'without admission of liability' - meaning the paying party doesn't admit fault.",
    shortDefinition: "An agreement to resolve a dispute out of court",
    category: "general",
    relatedTerms: ["Mediation", "Negotiation", "Without Prejudice"],
    ukSpecific: false,
  },
  {
    term: "Without Prejudice",
    definition: "A label applied to communications during settlement negotiations. 'Without prejudice' correspondence cannot be shown to a judge if negotiations fail and the case goes to court. This encourages open negotiation.",
    shortDefinition: "Private communications that can't be used in court",
    category: "procedure",
    relatedTerms: ["Settlement", "Negotiation"],
    example: "Emails marked 'Without Prejudice' during settlement talks cannot be shown to the judge.",
    ukSpecific: false,
  },
  
  // Court-Specific Terms
  {
    term: "Small Claims Track",
    definition: "A simplified court procedure for claims up to £10,000. Designed for self-representation, with limited costs recovery. Hearings are informal, and strict evidence rules are relaxed.",
    shortDefinition: "Simple court procedure for claims up to £10,000",
    category: "court",
    relatedTerms: ["Fast Track", "Multi-Track", "County Court"],
    ukSpecific: true,
  },
  {
    term: "Fast Track",
    definition: "Court procedure for claims between £10,000 and £25,000 that can be tried in one day. Has fixed costs and strict timescales. Designed to be more efficient than the multi-track.",
    shortDefinition: "Court procedure for medium-sized claims",
    category: "court",
    relatedTerms: ["Small Claims Track", "Multi-Track", "County Court"],
    ukSpecific: true,
  },
  {
    term: "Multi-Track",
    definition: "Court procedure for complex claims over £25,000 or cases requiring more than one day for trial. Has more flexible case management but potentially unlimited costs.",
    shortDefinition: "Court procedure for large or complex claims",
    category: "court",
    relatedTerms: ["Small Claims Track", "Fast Track", "High Court"],
    ukSpecific: true,
  },
  {
    term: "County Court",
    definition: "A court that handles most civil (non-criminal) cases in England and Wales. Deals with debt recovery, breach of contract, personal injury, and housing disputes. Most cases start here.",
    shortDefinition: "The main court for civil cases",
    category: "court",
    relatedTerms: ["High Court", "Magistrates Court"],
    ukSpecific: true,
  },
  {
    term: "Judgment",
    definition: "The court's official decision in a case. A judgment for the claimant means they won; a judgment for the defendant means they won. Judgments can include orders for payment or specific actions.",
    shortDefinition: "The court's official decision",
    category: "court",
    relatedTerms: ["Order", "Enforcement", "Appeal"],
    ukSpecific: false,
  },
  {
    term: "CCJ",
    definition: "County Court Judgment - a court order stating you owe money and must pay it. CCJs stay on your credit record for 6 years unless paid within 30 days. They can make it difficult to get credit.",
    shortDefinition: "A court order to pay money owed",
    category: "court",
    relatedTerms: ["County Court", "Judgment", "Credit Record"],
    ukSpecific: true,
  },

  // Employment Terms
  {
    term: "Employment Tribunal",
    definition: "A specialist court that handles employment disputes such as unfair dismissal, discrimination, and unpaid wages. There's usually a strict 3-month time limit (less one day) to bring a claim.",
    shortDefinition: "Court for employment disputes",
    category: "employment",
    relatedTerms: ["ACAS", "Unfair Dismissal", "ET1"],
    ukSpecific: true,
  },
  {
    term: "ACAS",
    definition: "Advisory, Conciliation and Arbitration Service - a government body that provides free employment advice and runs mandatory early conciliation before Employment Tribunal claims.",
    shortDefinition: "Free employment advice and conciliation service",
    category: "employment",
    relatedTerms: ["Early Conciliation", "Employment Tribunal"],
    ukSpecific: true,
  },
  {
    term: "Unfair Dismissal",
    definition: "When an employer terminates your employment without a fair reason or without following proper procedure. You generally need 2 years' service to claim unfair dismissal (some exceptions apply).",
    shortDefinition: "Being fired without fair reason or procedure",
    category: "employment",
    relatedTerms: ["Wrongful Dismissal", "Employment Tribunal", "Redundancy"],
    ukSpecific: true,
  },
  {
    term: "Wrongful Dismissal",
    definition: "Being dismissed in breach of your employment contract, such as not being given proper notice. Unlike unfair dismissal, there's no minimum service requirement.",
    shortDefinition: "Being fired in breach of contract",
    category: "employment",
    relatedTerms: ["Unfair Dismissal", "Notice Period", "Breach of Contract"],
    ukSpecific: true,
  },
  {
    term: "Constructive Dismissal",
    definition: "When an employee resigns because of their employer's serious breach of contract. You must resign promptly after the breach and can claim unfair dismissal at tribunal.",
    shortDefinition: "Being forced to resign due to employer's breach",
    category: "employment",
    relatedTerms: ["Unfair Dismissal", "Resignation", "Breach of Contract"],
    ukSpecific: true,
  },

  // Data Protection Terms
  {
    term: "Subject Access Request",
    definition: "A request under UK GDPR asking an organisation to provide all personal data they hold about you. Organisations must respond within one calendar month. Also known as SAR or DSAR.",
    shortDefinition: "Request for your personal data held by an organisation",
    category: "data_protection",
    relatedTerms: ["UK GDPR", "ICO", "Personal Data"],
    example: "You can make a SAR to your employer to get copies of all emails about you.",
    ukSpecific: true,
  },
  {
    term: "UK GDPR",
    definition: "The UK General Data Protection Regulation - law governing how organisations collect, use, and protect personal data. Gives individuals rights over their data including access, correction, and deletion.",
    shortDefinition: "UK law protecting personal data",
    category: "data_protection",
    relatedTerms: ["ICO", "Subject Access Request", "Data Breach"],
    ukSpecific: true,
  },
  {
    term: "ICO",
    definition: "Information Commissioner's Office - the UK regulator for data protection and freedom of information. You can complain to the ICO if an organisation mishandles your data.",
    shortDefinition: "UK data protection regulator",
    category: "data_protection",
    relatedTerms: ["UK GDPR", "Data Breach", "Complaint"],
    ukSpecific: true,
  },

  // Consumer Terms
  {
    term: "Consumer Rights Act",
    definition: "The main UK law protecting consumers. Covers goods (must be satisfactory quality, fit for purpose, as described), services (reasonable care and skill), and digital content.",
    shortDefinition: "Main UK law protecting consumer purchases",
    category: "consumer",
    relatedTerms: ["Satisfactory Quality", "Refund", "Remedy"],
    ukSpecific: true,
  },
  {
    term: "Section 75",
    definition: "Section 75 of the Consumer Credit Act - makes credit card companies jointly liable with sellers for purchases between £100 and £30,000. Useful if a seller goes bust or won't refund.",
    shortDefinition: "Credit card protection for purchases over £100",
    category: "consumer",
    relatedTerms: ["Chargeback", "Consumer Credit Act", "Refund"],
    ukSpecific: true,
  },
  {
    term: "Chargeback",
    definition: "A bank process to reverse a card payment when goods or services aren't received or aren't as described. Different from Section 75 - it's a card scheme rule, not a legal right.",
    shortDefinition: "Reversing a card payment through your bank",
    category: "consumer",
    relatedTerms: ["Section 75", "Refund", "Debit Card"],
    ukSpecific: false,
  },

  // Property Terms
  {
    term: "Deposit Protection",
    definition: "Legal requirement for landlords to protect tenancy deposits in a government-approved scheme within 30 days. Failure to protect can result in penalties of 1-3x the deposit amount.",
    shortDefinition: "Legal protection for rental deposits",
    category: "property",
    relatedTerms: ["Assured Shorthold Tenancy", "Section 21", "DPS"],
    ukSpecific: true,
  },
  {
    term: "Section 21",
    definition: "A 'no-fault' eviction notice a landlord can use to end an Assured Shorthold Tenancy. Requires at least 2 months' notice. Various conditions must be met for it to be valid.",
    shortDefinition: "No-fault eviction notice",
    category: "property",
    relatedTerms: ["Section 8", "Eviction", "AST"],
    ukSpecific: true,
  },
  {
    term: "Section 8",
    definition: "An eviction notice based on specific grounds, such as rent arrears or breach of tenancy terms. Unlike Section 21, the landlord must prove the tenant has done something wrong.",
    shortDefinition: "Eviction notice for specific reasons",
    category: "property",
    relatedTerms: ["Section 21", "Eviction", "Rent Arrears"],
    ukSpecific: true,
  },

  // Procedural Terms
  {
    term: "Limitation Period",
    definition: "The time limit for bringing a legal claim. For most contract disputes, it's 6 years. For personal injury, it's 3 years. Missing the limitation period usually bars your claim entirely.",
    shortDefinition: "Deadline for starting a legal claim",
    category: "procedure",
    relatedTerms: ["Time Limit", "Claim Form", "Statute-Barred"],
    ukSpecific: true,
  },
  {
    term: "Disclosure",
    definition: "The process of exchanging relevant documents between parties in litigation. You must disclose documents that support your case AND documents that harm it or help the other side.",
    shortDefinition: "Exchanging documents in a court case",
    category: "procedure",
    relatedTerms: ["Evidence", "Court", "Discovery"],
    ukSpecific: true,
  },
  {
    term: "Witness Statement",
    definition: "A written account of what someone saw, heard, or knows about a case. Must be signed with a 'statement of truth'. Lying in a witness statement is contempt of court.",
    shortDefinition: "Written account of evidence from a witness",
    category: "procedure",
    relatedTerms: ["Evidence", "Cross-Examination", "Statement of Truth"],
    ukSpecific: false,
  },
  {
    term: "Costs",
    definition: "Legal costs include court fees, solicitor fees, and expenses. The general rule is 'costs follow the event' - the loser pays the winner's costs. Small claims track has limited costs.",
    shortDefinition: "Legal fees and expenses in court cases",
    category: "procedure",
    relatedTerms: ["Fixed Costs", "Assessment", "Proportionality"],
    ukSpecific: true,
  },
];

/**
 * Get all glossary terms
 */
export function getAllTerms(): GlossaryTerm[] {
  return LEGAL_GLOSSARY.sort((a, b) => a.term.localeCompare(b.term));
}

/**
 * Get term by exact name
 */
export function getTerm(termName: string): GlossaryTerm | undefined {
  return LEGAL_GLOSSARY.find(
    (t) => t.term.toLowerCase() === termName.toLowerCase()
  );
}

/**
 * Search terms
 */
export function searchTerms(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return LEGAL_GLOSSARY.filter(
    (t) =>
      t.term.toLowerCase().includes(lowerQuery) ||
      t.definition.toLowerCase().includes(lowerQuery) ||
      t.shortDefinition.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => {
    // Prioritize terms that start with the query
    const aStarts = a.term.toLowerCase().startsWith(lowerQuery);
    const bStarts = b.term.toLowerCase().startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.term.localeCompare(b.term);
  });
}

/**
 * Get terms by category
 */
export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return LEGAL_GLOSSARY.filter((t) => t.category === category).sort((a, b) =>
    a.term.localeCompare(b.term)
  );
}

/**
 * Get related terms for a given term
 */
export function getRelatedTerms(termName: string): GlossaryTerm[] {
  const term = getTerm(termName);
  if (!term) return [];

  return term.relatedTerms
    .map((name) => getTerm(name))
    .filter((t): t is GlossaryTerm => t !== undefined);
}

/**
 * Detect legal terms in text and return with positions
 */
export function detectLegalTerms(text: string): Array<{
  term: GlossaryTerm;
  start: number;
  end: number;
}> {
  const results: Array<{ term: GlossaryTerm; start: number; end: number }> = [];
  const lowerText = text.toLowerCase();

  for (const term of LEGAL_GLOSSARY) {
    const lowerTerm = term.term.toLowerCase();
    let searchIndex = 0;

    while (true) {
      const index = lowerText.indexOf(lowerTerm, searchIndex);
      if (index === -1) break;

      // Check word boundaries
      const beforeChar = index > 0 ? lowerText[index - 1] : " ";
      const afterChar =
        index + lowerTerm.length < lowerText.length
          ? lowerText[index + lowerTerm.length]
          : " ";

      if (!/[a-z]/.test(beforeChar) && !/[a-z]/.test(afterChar)) {
        results.push({
          term,
          start: index,
          end: index + term.term.length,
        });
      }

      searchIndex = index + 1;
    }
  }

  // Sort by position and remove overlaps
  results.sort((a, b) => a.start - b.start);
  const filtered: typeof results = [];
  let lastEnd = -1;

  for (const result of results) {
    if (result.start >= lastEnd) {
      filtered.push(result);
      lastEnd = result.end;
    }
  }

  return filtered;
}

/**
 * Get categories with counts
 */
export function getCategoriesWithCounts(): Array<{
  category: GlossaryCategory;
  label: string;
  count: number;
}> {
  const categoryLabels: Record<GlossaryCategory, string> = {
    general: "General Legal",
    court: "Court & Litigation",
    contracts: "Contracts",
    employment: "Employment",
    property: "Property & Housing",
    data_protection: "Data Protection",
    consumer: "Consumer Rights",
    procedure: "Court Procedure",
  };

  const counts = LEGAL_GLOSSARY.reduce((acc, term) => {
    acc[term.category] = (acc[term.category] || 0) + 1;
    return acc;
  }, {} as Record<GlossaryCategory, number>);

  return Object.entries(categoryLabels).map(([category, label]) => ({
    category: category as GlossaryCategory,
    label,
    count: counts[category as GlossaryCategory] || 0,
  }));
}
