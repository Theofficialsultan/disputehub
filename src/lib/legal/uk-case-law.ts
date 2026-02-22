/**
 * UK CASE LAW DATABASE
 * 
 * Authoritative UK case citations for use in legal documents.
 * Organized by dispute type and legal principle.
 * 
 * Format: [Case Name] [Year] [Court] [Citation] - [Brief holding]
 */

// ============================================================================
// CASE CITATION TYPES
// ============================================================================

export interface CaseCitation {
  name: string;
  year: number;
  court: string;
  citation: string;
  holding: string;
  principle: string;
  applicableTo: string[];  // Dispute types this applies to
  keywords: string[];
}

// ============================================================================
// CONSUMER RIGHTS CASES
// ============================================================================

export const CONSUMER_CASES: CaseCitation[] = [
  // Goods quality & fitness for purpose
  {
    name: "Clegg v Olle Andersson",
    year: 2003,
    court: "Court of Appeal",
    citation: "[2003] EWCA Civ 320",
    holding: "Buyer entitled to reject goods even after attempting repair, as goods were not of satisfactory quality from the outset",
    principle: "Right to reject for quality issues survives initial repair attempts",
    applicableTo: ["CONSUMER_GOODS", "FAULTY_GOODS", "REFUND_DISPUTE"],
    keywords: ["satisfactory quality", "rejection", "repair", "consumer rights"]
  },
  {
    name: "Bernstein v Pamson Motors",
    year: 1987,
    court: "Queen's Bench Division",
    citation: "[1987] 2 All ER 220",
    holding: "Three weeks and 140 miles was too long to reject a defective car, establishing that rejection must be prompt",
    principle: "Right to reject must be exercised within reasonable time",
    applicableTo: ["CONSUMER_GOODS", "VEHICLE_DISPUTE"],
    keywords: ["reasonable time", "rejection", "acceptance"]
  },
  {
    name: "Bramhill v Edwards",
    year: 2004,
    court: "Court of Appeal",
    citation: "[2004] EWCA Civ 403",
    holding: "Minor defects that do not affect fitness for purpose do not breach satisfactory quality requirement",
    principle: "Trivial defects may not amount to breach",
    applicableTo: ["CONSUMER_GOODS"],
    keywords: ["satisfactory quality", "minor defects", "de minimis"]
  },
  {
    name: "Rogers v Parish",
    year: 1987,
    court: "Court of Appeal",
    citation: "[1987] QB 933",
    holding: "Goods must be of satisfactory quality considering all circumstances including price paid",
    principle: "Quality expectation linked to price paid",
    applicableTo: ["CONSUMER_GOODS", "VEHICLE_DISPUTE"],
    keywords: ["satisfactory quality", "price", "expectation"]
  },

  // Misrepresentation
  {
    name: "Doyle v Olby (Ironmongers) Ltd",
    year: 1969,
    court: "Court of Appeal",
    citation: "[1969] 2 QB 158",
    holding: "Damages for fraudulent misrepresentation include all losses flowing directly from the fraud",
    principle: "Measure of damages for fraudulent misrepresentation",
    applicableTo: ["CONSUMER_GOODS", "SERVICES_DISPUTE", "MISREPRESENTATION"],
    keywords: ["misrepresentation", "fraud", "damages"]
  },
  {
    name: "Hedley Byrne v Heller",
    year: 1964,
    court: "House of Lords",
    citation: "[1964] AC 465",
    holding: "Duty of care exists for negligent misstatements causing economic loss where special relationship exists",
    principle: "Negligent misstatement liability",
    applicableTo: ["SERVICES_DISPUTE", "PROFESSIONAL_NEGLIGENCE"],
    keywords: ["negligent misstatement", "duty of care", "special relationship"]
  },
  
  // Additional consumer cases
  {
    name: "Stevenson v Rogers",
    year: 1999,
    court: "Court of Appeal",
    citation: "[1999] QB 1028",
    holding: "Goods sold by a business seller are sold 'in the course of a business' even if selling is not the main business activity",
    principle: "Wide interpretation of 'in course of business'",
    applicableTo: ["CONSUMER_GOODS", "VEHICLE_DISPUTE"],
    keywords: ["course of business", "sale of goods", "trader"]
  },
  {
    name: "Thain v Anniesland Trade Centre",
    year: 1997,
    court: "Sheriff Court (Scotland)",
    citation: "1997 SLT (Sh Ct) 102",
    holding: "Second-hand car with excessive oil consumption was not of satisfactory quality despite low price",
    principle: "Even cheap goods must meet minimum quality standards",
    applicableTo: ["CONSUMER_GOODS", "VEHICLE_DISPUTE"],
    keywords: ["satisfactory quality", "second-hand", "vehicle"]
  },
  {
    name: "Jewson Ltd v Boyhan",
    year: 2003,
    court: "Court of Appeal",
    citation: "[2003] EWCA Civ 1030",
    holding: "Fitness for purpose requires goods to work for buyer's particular purpose if made known to seller",
    principle: "Fitness for particular purpose when purpose disclosed",
    applicableTo: ["CONSUMER_GOODS", "BUILDING_MATERIALS"],
    keywords: ["fitness for purpose", "particular purpose", "disclosure"]
  },
  {
    name: "Lowe v Machell Joinery Ltd",
    year: 2011,
    court: "Court of Appeal",
    citation: "[2011] EWCA Civ 794",
    holding: "Stairs that did not comply with building regulations were not of satisfactory quality",
    principle: "Compliance with regulations relevant to quality",
    applicableTo: ["CONSUMER_GOODS", "BUILDING_DISPUTE"],
    keywords: ["satisfactory quality", "building regulations", "compliance"]
  },
  {
    name: "Durkin v DSG Retail Ltd",
    year: 2014,
    court: "Supreme Court",
    citation: "[2014] UKSC 21",
    holding: "Consumer who validly rescinds credit agreement not liable for further payments; creditor must investigate disputes",
    principle: "Rescission of linked credit agreements",
    applicableTo: ["CONSUMER_GOODS", "CONSUMER_CREDIT", "REFUND_DISPUTE"],
    keywords: ["rescission", "credit agreement", "section 75"]
  },
  {
    name: "OFT v Purely Creative Ltd",
    year: 2011,
    court: "Court of Appeal",
    citation: "[2011] EWCA Civ 920",
    holding: "Prize draw requiring purchase or premium rate call to claim was misleading commercial practice",
    principle: "Misleading omissions in prize promotions",
    applicableTo: ["CONSUMER_GOODS", "MISLEADING_PRACTICE"],
    keywords: ["misleading", "prize draw", "consumer protection"]
  },
  {
    name: "Truk (UK) Ltd v Tokmakidis GmbH",
    year: 2000,
    court: "Queen's Bench Division",
    citation: "[2000] 1 Lloyd's Rep 543",
    holding: "Buyer loses right to reject if goods accepted by act inconsistent with seller's ownership",
    principle: "Loss of right to reject through acceptance",
    applicableTo: ["CONSUMER_GOODS", "REJECTION"],
    keywords: ["acceptance", "rejection", "inconsistent act"]
  },
];

// ============================================================================
// EMPLOYMENT CASES
// ============================================================================

export const EMPLOYMENT_CASES: CaseCitation[] = [
  // Unfair dismissal
  {
    name: "Polkey v AE Dayton Services Ltd",
    year: 1988,
    court: "House of Lords",
    citation: "[1988] AC 344",
    holding: "Failure to follow fair procedures makes dismissal unfair, even if outcome would have been the same",
    principle: "Procedural fairness is essential for fair dismissal",
    applicableTo: ["UNFAIR_DISMISSAL", "REDUNDANCY"],
    keywords: ["unfair dismissal", "procedure", "consultation"]
  },
  {
    name: "Iceland Frozen Foods v Jones",
    year: 1983,
    court: "EAT",
    citation: "[1983] ICR 17",
    holding: "Test is whether dismissal fell within range of reasonable responses open to a reasonable employer",
    principle: "Band of reasonable responses test",
    applicableTo: ["UNFAIR_DISMISSAL"],
    keywords: ["reasonable employer", "range of responses", "misconduct"]
  },
  {
    name: "British Home Stores v Burchell",
    year: 1980,
    court: "EAT",
    citation: "[1980] ICR 303",
    holding: "For misconduct dismissal: (1) genuine belief in guilt, (2) reasonable grounds, (3) reasonable investigation",
    principle: "Three-stage test for misconduct dismissals",
    applicableTo: ["UNFAIR_DISMISSAL", "MISCONDUCT"],
    keywords: ["misconduct", "investigation", "reasonable belief"]
  },
  {
    name: "Western Excavating v Sharp",
    year: 1978,
    court: "Court of Appeal",
    citation: "[1978] QB 761",
    holding: "Constructive dismissal requires fundamental breach of contract by employer",
    principle: "Test for constructive dismissal",
    applicableTo: ["UNFAIR_DISMISSAL", "CONSTRUCTIVE_DISMISSAL"],
    keywords: ["constructive dismissal", "fundamental breach", "resignation"]
  },

  // Unpaid wages
  {
    name: "Delaney v Staples",
    year: 1992,
    court: "House of Lords",
    citation: "[1992] 1 AC 687",
    holding: "Wages include any sum payable by employer in connection with employment",
    principle: "Definition of wages for unlawful deduction purposes",
    applicableTo: ["UNPAID_WAGES", "DEDUCTION_FROM_WAGES"],
    keywords: ["wages", "deduction", "payment"]
  },
  {
    name: "Greg May v Dring",
    year: 1990,
    court: "EAT",
    citation: "[1990] IRLR 19",
    holding: "Commission payments are wages within ERA 1996 s.27",
    principle: "Commission counts as wages",
    applicableTo: ["UNPAID_WAGES", "COMMISSION"],
    keywords: ["commission", "wages", "bonus"]
  },

  // Discrimination
  {
    name: "Vento v Chief Constable of West Yorkshire",
    year: 2003,
    court: "Court of Appeal",
    citation: "[2003] ICR 318",
    holding: "Established three bands for injury to feelings awards in discrimination cases",
    principle: "Vento bands for compensation",
    applicableTo: ["DISCRIMINATION", "HARASSMENT"],
    keywords: ["discrimination", "compensation", "injury to feelings"]
  },
  {
    name: "De Souza v Cobden Sport",
    year: 2024,
    court: "Court of Appeal",
    citation: "[2024] EWCA Civ 276",
    holding: "Updated Vento bands: Lower £1,200-£11,700; Middle £11,700-£35,200; Upper £35,200-£58,700",
    principle: "Current Vento bands (2024)",
    applicableTo: ["DISCRIMINATION", "HARASSMENT"],
    keywords: ["vento bands", "compensation", "injury to feelings"]
  },
  {
    name: "Brown v Rentokil",
    year: 1998,
    court: "ECJ",
    citation: "[1998] ECR I-4185",
    holding: "Dismissal for pregnancy-related illness is direct sex discrimination",
    principle: "Pregnancy discrimination is automatic sex discrimination",
    applicableTo: ["DISCRIMINATION", "PREGNANCY_DISCRIMINATION"],
    keywords: ["pregnancy", "discrimination", "sex discrimination"]
  },
  
  // Additional employment cases
  {
    name: "Autoclenz Ltd v Belcher",
    year: 2011,
    court: "Supreme Court",
    citation: "[2011] UKSC 41",
    holding: "Court will look at true nature of relationship, not just written terms, to determine employment status",
    principle: "Substance over form in employment status",
    applicableTo: ["EMPLOYMENT_STATUS", "UNPAID_WAGES", "GIG_ECONOMY"],
    keywords: ["employment status", "worker", "self-employed", "sham"]
  },
  {
    name: "Uber BV v Aslam",
    year: 2021,
    court: "Supreme Court",
    citation: "[2021] UKSC 5",
    holding: "Uber drivers are workers entitled to minimum wage and holiday pay, not self-employed contractors",
    principle: "Gig economy workers may be workers not contractors",
    applicableTo: ["EMPLOYMENT_STATUS", "UNPAID_WAGES", "GIG_ECONOMY"],
    keywords: ["worker", "gig economy", "minimum wage", "uber"]
  },
  {
    name: "Williams v Compair Maxam Ltd",
    year: 1982,
    court: "EAT",
    citation: "[1982] ICR 156",
    holding: "Fair redundancy requires: warning, consultation, objective selection criteria, and consideration of alternatives",
    principle: "Williams criteria for fair redundancy",
    applicableTo: ["REDUNDANCY", "UNFAIR_DISMISSAL"],
    keywords: ["redundancy", "consultation", "selection criteria"]
  },
  {
    name: "Malik v BCCI",
    year: 1998,
    court: "House of Lords",
    citation: "[1998] AC 20",
    holding: "Employer's conduct destroying trust and confidence can give rise to damages for stigma/reputational harm",
    principle: "Stigma damages for breach of trust",
    applicableTo: ["UNFAIR_DISMISSAL", "BREACH_OF_CONTRACT"],
    keywords: ["trust and confidence", "stigma", "reputation"]
  },
  {
    name: "Woods v WM Car Services",
    year: 1982,
    court: "Court of Appeal",
    citation: "[1982] ICR 693",
    holding: "Implied term of trust and confidence requires employer not to act in way calculated to destroy relationship",
    principle: "Implied term of mutual trust and confidence",
    applicableTo: ["CONSTRUCTIVE_DISMISSAL", "UNFAIR_DISMISSAL"],
    keywords: ["trust and confidence", "implied term", "constructive dismissal"]
  },
  {
    name: "Gogay v Hertfordshire CC",
    year: 2000,
    court: "Court of Appeal",
    citation: "[2000] IRLR 703",
    holding: "Suspension without reasonable cause can breach implied term of trust and confidence",
    principle: "Suspension must have reasonable cause",
    applicableTo: ["CONSTRUCTIVE_DISMISSAL", "UNFAIR_DISMISSAL"],
    keywords: ["suspension", "trust and confidence", "reasonable cause"]
  },
  {
    name: "Hollister v National Farmers Union",
    year: 1979,
    court: "Court of Appeal",
    citation: "[1979] ICR 542",
    holding: "Reorganisation may justify dismissal but employer must show sound business reason",
    principle: "Business reorganisation as fair reason",
    applicableTo: ["UNFAIR_DISMISSAL", "REDUNDANCY"],
    keywords: ["reorganisation", "business reason", "some other substantial reason"]
  },
  {
    name: "Norton Tool Co v Tewson",
    year: 1973,
    court: "NIRC",
    citation: "[1973] 1 WLR 45",
    holding: "Compensatory award aims to compensate for financial loss, not to punish employer",
    principle: "Compensatory principle in unfair dismissal",
    applicableTo: ["UNFAIR_DISMISSAL"],
    keywords: ["compensation", "financial loss", "assessment"]
  },
  {
    name: "Chagger v Abbey National",
    year: 2010,
    court: "Court of Appeal",
    citation: "[2010] ICR 397",
    holding: "Tribunal can make substantial award for career-long loss of earnings in discrimination case",
    principle: "Career-long loss in discrimination compensation",
    applicableTo: ["DISCRIMINATION", "UNFAIR_DISMISSAL"],
    keywords: ["compensation", "career loss", "future loss"]
  },
  {
    name: "King v The Great Britain-China Centre",
    year: 1992,
    court: "Court of Appeal",
    citation: "[1992] ICR 516",
    holding: "If claimant proves primary facts suggesting discrimination, burden shifts to employer to explain",
    principle: "Shifting burden of proof in discrimination",
    applicableTo: ["DISCRIMINATION"],
    keywords: ["burden of proof", "inference", "explanation"]
  },
  {
    name: "Shamoon v Chief Constable of RUC",
    year: 2003,
    court: "House of Lords",
    citation: "[2003] ICR 337",
    holding: "Detriment means treatment that reasonable worker would consider disadvantageous",
    principle: "Definition of detriment in discrimination",
    applicableTo: ["DISCRIMINATION", "VICTIMISATION"],
    keywords: ["detriment", "disadvantage", "reasonable worker"]
  },
  {
    name: "Archibald v Fife Council",
    year: 2004,
    court: "House of Lords",
    citation: "[2004] ICR 954",
    holding: "Reasonable adjustments duty may require treating disabled person more favourably than others",
    principle: "Positive discrimination permitted for disability",
    applicableTo: ["DISCRIMINATION", "DISABILITY_DISCRIMINATION"],
    keywords: ["reasonable adjustments", "disability", "positive action"]
  },
  {
    name: "London Underground v Edwards",
    year: 1999,
    court: "Court of Appeal",
    citation: "[1999] ICR 494",
    holding: "Requirement that disproportionately affects women (shift patterns affecting single mothers) is indirect discrimination",
    principle: "Indirect sex discrimination via working patterns",
    applicableTo: ["DISCRIMINATION", "INDIRECT_DISCRIMINATION"],
    keywords: ["indirect discrimination", "working patterns", "proportionate"]
  },
];

// ============================================================================
// CONTRACT & DEBT CASES
// ============================================================================

export const CONTRACT_CASES: CaseCitation[] = [
  // Breach of contract
  {
    name: "Hadley v Baxendale",
    year: 1854,
    court: "Court of Exchequer",
    citation: "(1854) 9 Ex 341",
    holding: "Damages limited to losses naturally arising or within contemplation of parties at contract formation",
    principle: "Remoteness of damage in contract",
    applicableTo: ["BREACH_OF_CONTRACT", "SERVICES_DISPUTE", "UNPAID_INVOICE"],
    keywords: ["damages", "remoteness", "contemplation"]
  },
  {
    name: "Robinson v Harman",
    year: 1848,
    court: "Court of Exchequer",
    citation: "(1848) 1 Ex 850",
    holding: "Purpose of contract damages is to put claimant in position as if contract had been performed",
    principle: "Expectation measure of damages",
    applicableTo: ["BREACH_OF_CONTRACT", "SERVICES_DISPUTE"],
    keywords: ["damages", "expectation loss", "compensation"]
  },
  {
    name: "Jarvis v Swan Tours",
    year: 1973,
    court: "Court of Appeal",
    citation: "[1973] QB 233",
    holding: "Damages for disappointment and loss of enjoyment recoverable where contract's purpose was to provide pleasure",
    principle: "Damages for distress in consumer contracts",
    applicableTo: ["CONSUMER_GOODS", "SERVICES_DISPUTE", "HOLIDAY_DISPUTE"],
    keywords: ["distress", "disappointment", "holiday"]
  },
  {
    name: "Ruxley Electronics v Forsyth",
    year: 1996,
    court: "House of Lords",
    citation: "[1996] AC 344",
    holding: "Where cost of reinstatement is disproportionate to benefit, damages may be limited to difference in value",
    principle: "Proportionality in remedial damages",
    applicableTo: ["SERVICES_DISPUTE", "BUILDING_DISPUTE", "BREACH_OF_CONTRACT"],
    keywords: ["reinstatement", "proportionality", "damages"]
  },
  {
    name: "White & Carter v McGregor",
    year: 1962,
    court: "House of Lords",
    citation: "[1962] AC 413",
    holding: "Innocent party may elect to continue performance and claim full contract price rather than accept repudiation",
    principle: "Election to affirm contract after breach",
    applicableTo: ["BREACH_OF_CONTRACT", "UNPAID_INVOICE"],
    keywords: ["affirmation", "repudiation", "election"]
  },
  {
    name: "Hong Kong Fir Shipping v Kawasaki",
    year: 1962,
    court: "Court of Appeal",
    citation: "[1962] 2 QB 26",
    holding: "Not every breach entitles termination; depends whether breach deprives innocent party of substantially whole benefit",
    principle: "Innominate terms and substantial deprivation test",
    applicableTo: ["BREACH_OF_CONTRACT", "SERVICES_DISPUTE"],
    keywords: ["termination", "innominate term", "substantial breach"]
  },
  {
    name: "Bunge Corporation v Tradax",
    year: 1981,
    court: "House of Lords",
    citation: "[1981] 1 WLR 711",
    holding: "Time stipulations in mercantile contracts are conditions, breach of which allows termination",
    principle: "Time as of the essence in commercial contracts",
    applicableTo: ["BREACH_OF_CONTRACT", "DELIVERY_DISPUTE"],
    keywords: ["time", "condition", "termination"]
  },

  // Payment and debt
  {
    name: "Sempra Metals v IRC",
    year: 2007,
    court: "House of Lords",
    citation: "[2007] UKHL 34",
    holding: "Compound interest may be awarded as damages where appropriate",
    principle: "Compound interest as damages",
    applicableTo: ["UNPAID_INVOICE", "DEBT_RECOVERY"],
    keywords: ["interest", "compound interest", "damages"]
  },
  {
    name: "Director General of Fair Trading v First National Bank",
    year: 2001,
    court: "House of Lords",
    citation: "[2001] UKHL 52",
    holding: "Term allowing interest to accrue after judgment was not unfair under Unfair Terms regulations",
    principle: "Assessment of fairness in consumer credit terms",
    applicableTo: ["DEBT_RECOVERY", "CONSUMER_CREDIT"],
    keywords: ["unfair terms", "interest", "consumer credit"]
  },
  
  // Formation and terms
  {
    name: "Carlill v Carbolic Smoke Ball Co",
    year: 1893,
    court: "Court of Appeal",
    citation: "[1893] 1 QB 256",
    holding: "Unilateral offer to the world at large can create binding contract when conditions performed",
    principle: "Unilateral contracts and offer to the world",
    applicableTo: ["BREACH_OF_CONTRACT", "CONSUMER_GOODS"],
    keywords: ["offer", "acceptance", "unilateral contract"]
  },
  {
    name: "Baird Textile Holdings v Marks & Spencer",
    year: 2001,
    court: "Court of Appeal",
    citation: "[2001] EWCA Civ 274",
    holding: "Long-standing business relationship without express terms does not create enforceable contract",
    principle: "Certainty of terms required for contract",
    applicableTo: ["BREACH_OF_CONTRACT", "UNPAID_INVOICE"],
    keywords: ["certainty", "implied contract", "business relationship"]
  },
  {
    name: "Williams v Roffey Bros",
    year: 1991,
    court: "Court of Appeal",
    citation: "[1991] 1 QB 1",
    holding: "Practical benefit to promisor can constitute consideration for promise of extra payment",
    principle: "Practical benefit as consideration",
    applicableTo: ["BREACH_OF_CONTRACT", "SERVICES_DISPUTE"],
    keywords: ["consideration", "variation", "practical benefit"]
  },
];

// ============================================================================
// LANDLORD & TENANT CASES
// ============================================================================

export const TENANCY_CASES: CaseCitation[] = [
  // Deposits
  {
    name: "Tiensia v Vision Enterprises Ltd",
    year: 2011,
    court: "Court of Appeal",
    citation: "[2011] EWCA Civ 1623",
    holding: "Penalty for failure to protect deposit applies per deposit, not per breach",
    principle: "Deposit protection penalties",
    applicableTo: ["TENANCY_DEPOSIT", "LANDLORD_DISPUTE"],
    keywords: ["deposit", "protection", "penalty"]
  },
  {
    name: "Charalambous v Ng",
    year: 2014,
    court: "Court of Appeal",
    citation: "[2014] EWCA Civ 1604",
    holding: "Deposit protection requirement continues throughout tenancy including periodic tenancies",
    principle: "Ongoing deposit protection obligation",
    applicableTo: ["TENANCY_DEPOSIT"],
    keywords: ["deposit", "periodic tenancy", "protection"]
  },
  {
    name: "Superstrike Ltd v Rodrigues",
    year: 2013,
    court: "Court of Appeal",
    citation: "[2013] EWCA Civ 669",
    holding: "Landlord cannot serve valid section 21 notice if deposit not protected within 30 days",
    principle: "Deposit protection required for section 21",
    applicableTo: ["TENANCY_DEPOSIT", "EVICTION"],
    keywords: ["section 21", "deposit", "protection"]
  },

  // Repairs and habitability
  {
    name: "Southwark LBC v Mills",
    year: 2001,
    court: "House of Lords",
    citation: "[2001] 1 AC 1",
    holding: "Landlord's covenant of quiet enjoyment does not extend to ordinary use of premises by other tenants",
    principle: "Limits of quiet enjoyment covenant",
    applicableTo: ["LANDLORD_DISPUTE", "NOISE_NUISANCE"],
    keywords: ["quiet enjoyment", "nuisance", "noise"]
  },
  {
    name: "Lee v Leeds City Council",
    year: 2002,
    court: "Court of Appeal",
    citation: "[2002] EWCA Civ 6",
    holding: "Condensation dampness causing health issues can breach landlord's repairing obligation",
    principle: "Dampness as disrepair",
    applicableTo: ["LANDLORD_DISPUTE", "DISREPAIR"],
    keywords: ["damp", "disrepair", "health", "habitability"]
  },
  {
    name: "Quick v Taff Ely BC",
    year: 1986,
    court: "Court of Appeal",
    citation: "[1986] QB 809",
    holding: "Landlord's repairing covenant does not extend to design defects causing condensation",
    principle: "Repair vs improvement distinction",
    applicableTo: ["LANDLORD_DISPUTE", "DISREPAIR"],
    keywords: ["repair", "improvement", "design defect", "condensation"]
  },
  {
    name: "Earle v Charalambous",
    year: 2006,
    court: "Court of Appeal",
    citation: "[2006] EWCA Civ 1090",
    holding: "Landlord's knowledge of disrepair not required for liability under s.11 Landlord and Tenant Act 1985",
    principle: "Strict liability for disrepair once notified",
    applicableTo: ["LANDLORD_DISPUTE", "DISREPAIR"],
    keywords: ["notice", "disrepair", "liability"]
  },
  {
    name: "Daejan Investments v Benson",
    year: 2013,
    court: "Supreme Court",
    citation: "[2013] UKSC 14",
    holding: "Service charge consultation failures may be dispensed with if no prejudice to tenants",
    principle: "Service charge consultation dispensation",
    applicableTo: ["LANDLORD_DISPUTE", "SERVICE_CHARGE"],
    keywords: ["service charge", "consultation", "leasehold"]
  },
  {
    name: "Ofulue v Bossert",
    year: 2009,
    court: "House of Lords",
    citation: "[2009] UKHL 16",
    holding: "Without prejudice negotiations cannot be used to prove adverse possession",
    principle: "Without prejudice rule in property disputes",
    applicableTo: ["LANDLORD_DISPUTE", "PROPERTY_DISPUTE"],
    keywords: ["without prejudice", "adverse possession", "negotiations"]
  },
  {
    name: "Wallace v Manchester City Council",
    year: 1998,
    court: "Court of Appeal",
    citation: "[1998] 3 EGLR 38",
    holding: "Damages for disrepair include both diminution in value and distress/inconvenience",
    principle: "Damages heads for housing disrepair",
    applicableTo: ["LANDLORD_DISPUTE", "DISREPAIR"],
    keywords: ["damages", "disrepair", "distress", "inconvenience"]
  },
  {
    name: "Shine v English Churches Housing Group",
    year: 2004,
    court: "Court of Appeal",
    citation: "[2004] EWCA Civ 434",
    holding: "Landlord not liable for disrepair they do not know about unless they ought to have known",
    principle: "Knowledge requirement for disrepair liability",
    applicableTo: ["LANDLORD_DISPUTE", "DISREPAIR"],
    keywords: ["knowledge", "notice", "disrepair"]
  },
  {
    name: "Perera v Vandiyar",
    year: 1953,
    court: "Court of Appeal",
    citation: "[1953] 1 WLR 672",
    holding: "Unlawful eviction/harassment by landlord can give rise to exemplary damages",
    principle: "Exemplary damages for unlawful eviction",
    applicableTo: ["LANDLORD_DISPUTE", "EVICTION", "HARASSMENT"],
    keywords: ["unlawful eviction", "harassment", "exemplary damages"]
  },
];

// ============================================================================
// PROFESSIONAL NEGLIGENCE & SERVICES
// ============================================================================

export const PROFESSIONAL_CASES: CaseCitation[] = [
  {
    name: "Bolam v Friern Hospital",
    year: 1957,
    court: "Queen's Bench Division",
    citation: "[1957] 1 WLR 582",
    holding: "Professional not negligent if acting in accordance with practice accepted by responsible body of professionals",
    principle: "Bolam test for professional standard of care",
    applicableTo: ["PROFESSIONAL_NEGLIGENCE", "MEDICAL_NEGLIGENCE"],
    keywords: ["professional", "standard of care", "responsible body"]
  },
  {
    name: "Bolitho v City & Hackney HA",
    year: 1998,
    court: "House of Lords",
    citation: "[1998] AC 232",
    holding: "Professional opinion must have logical basis and withstand logical analysis to be Bolam-compliant",
    principle: "Bolitho refinement requiring logical basis",
    applicableTo: ["PROFESSIONAL_NEGLIGENCE", "MEDICAL_NEGLIGENCE"],
    keywords: ["professional", "logical basis", "Bolam"]
  },
  {
    name: "Henderson v Merrett Syndicates",
    year: 1995,
    court: "House of Lords",
    citation: "[1995] 2 AC 145",
    holding: "Assumption of responsibility for task creates duty of care to person relying on professional skill",
    principle: "Assumption of responsibility creates duty",
    applicableTo: ["PROFESSIONAL_NEGLIGENCE", "SERVICES_DISPUTE"],
    keywords: ["assumption of responsibility", "duty of care", "reliance"]
  },
  {
    name: "Caparo Industries v Dickman",
    year: 1990,
    court: "House of Lords",
    citation: "[1990] 2 AC 605",
    holding: "Duty of care requires: foreseeability, proximity, and fair/just/reasonable to impose duty",
    principle: "Three-stage test for duty of care",
    applicableTo: ["PROFESSIONAL_NEGLIGENCE", "SERVICES_DISPUTE"],
    keywords: ["duty of care", "foreseeability", "proximity"]
  },
  {
    name: "South Australia Asset Management v York Montague (SAAMCO)",
    year: 1997,
    court: "House of Lords",
    citation: "[1997] AC 191",
    holding: "Professional's liability limited to consequences of information being wrong, not all losses from transaction",
    principle: "SAAMCO principle limiting scope of liability",
    applicableTo: ["PROFESSIONAL_NEGLIGENCE", "SURVEYOR_NEGLIGENCE"],
    keywords: ["scope of duty", "information", "advice", "valuation"]
  },
  {
    name: "Platform Home Loans v Oyston Shipways",
    year: 2000,
    court: "House of Lords",
    citation: "[2000] 2 AC 190",
    holding: "Lender must give credit for actual sale proceeds when calculating negligent valuation losses",
    principle: "Credit for actual proceeds in valuation claims",
    applicableTo: ["PROFESSIONAL_NEGLIGENCE", "SURVEYOR_NEGLIGENCE"],
    keywords: ["valuation", "credit", "calculation"]
  },
  {
    name: "Gregg v Scott",
    year: 2005,
    court: "House of Lords",
    citation: "[2005] UKHL 2",
    holding: "Loss of chance of better outcome insufficient to establish causation in clinical negligence",
    principle: "Loss of chance generally not recoverable in negligence",
    applicableTo: ["PROFESSIONAL_NEGLIGENCE", "MEDICAL_NEGLIGENCE"],
    keywords: ["loss of chance", "causation", "medical"]
  },
];

// ============================================================================
// STATUTORY REFERENCES
// ============================================================================

export interface StatuteReference {
  shortName: string;
  fullName: string;
  year: number;
  relevantSections: {
    section: string;
    description: string;
    applicableTo: string[];
  }[];
}

export const KEY_STATUTES: StatuteReference[] = [
  {
    shortName: "CRA 2015",
    fullName: "Consumer Rights Act 2015",
    year: 2015,
    relevantSections: [
      { section: "s.9", description: "Goods to be of satisfactory quality", applicableTo: ["CONSUMER_GOODS", "FAULTY_GOODS"] },
      { section: "s.10", description: "Goods to be fit for particular purpose", applicableTo: ["CONSUMER_GOODS", "FAULTY_GOODS"] },
      { section: "s.11", description: "Goods to be as described", applicableTo: ["CONSUMER_GOODS", "MISREPRESENTATION"] },
      { section: "s.19", description: "Consumer's right to reject", applicableTo: ["CONSUMER_GOODS", "REFUND_DISPUTE"] },
      { section: "s.20", description: "Right to repair or replacement", applicableTo: ["CONSUMER_GOODS", "FAULTY_GOODS"] },
      { section: "s.22", description: "Right to price reduction", applicableTo: ["CONSUMER_GOODS"] },
      { section: "s.23", description: "Right to final reject (after failed repair)", applicableTo: ["CONSUMER_GOODS", "FAULTY_GOODS"] },
      { section: "s.49", description: "Service to be performed with reasonable care and skill", applicableTo: ["SERVICES_DISPUTE"] },
      { section: "s.52", description: "Service to be performed in reasonable time", applicableTo: ["SERVICES_DISPUTE"] },
      { section: "s.54", description: "Consumer's right to require repeat performance", applicableTo: ["SERVICES_DISPUTE"] },
    ]
  },
  {
    shortName: "ERA 1996",
    fullName: "Employment Rights Act 1996",
    year: 1996,
    relevantSections: [
      { section: "s.13", description: "Right not to suffer unauthorised deductions from wages", applicableTo: ["UNPAID_WAGES", "DEDUCTION_FROM_WAGES"] },
      { section: "s.23", description: "Complaints to employment tribunals re: deductions", applicableTo: ["UNPAID_WAGES"] },
      { section: "s.86", description: "Rights to minimum notice periods", applicableTo: ["UNFAIR_DISMISSAL", "WRONGFUL_DISMISSAL"] },
      { section: "s.94", description: "Right not to be unfairly dismissed", applicableTo: ["UNFAIR_DISMISSAL"] },
      { section: "s.98", description: "General requirements for fair dismissal", applicableTo: ["UNFAIR_DISMISSAL"] },
      { section: "s.111", description: "Complaints to employment tribunal", applicableTo: ["UNFAIR_DISMISSAL"] },
      { section: "s.139", description: "Redundancy", applicableTo: ["REDUNDANCY"] },
    ]
  },
  {
    shortName: "EqA 2010",
    fullName: "Equality Act 2010",
    year: 2010,
    relevantSections: [
      { section: "s.13", description: "Direct discrimination", applicableTo: ["DISCRIMINATION"] },
      { section: "s.18", description: "Pregnancy and maternity discrimination in work", applicableTo: ["DISCRIMINATION", "PREGNANCY_DISCRIMINATION"] },
      { section: "s.19", description: "Indirect discrimination", applicableTo: ["DISCRIMINATION"] },
      { section: "s.26", description: "Harassment", applicableTo: ["DISCRIMINATION", "HARASSMENT"] },
      { section: "s.27", description: "Victimisation", applicableTo: ["DISCRIMINATION"] },
      { section: "s.39", description: "Employees and applicants: prohibited conduct", applicableTo: ["DISCRIMINATION"] },
    ]
  },
  {
    shortName: "HA 2004",
    fullName: "Housing Act 2004",
    year: 2004,
    relevantSections: [
      { section: "s.213", description: "Requirements relating to tenancy deposits", applicableTo: ["TENANCY_DEPOSIT"] },
      { section: "s.214", description: "Proceedings relating to deposits", applicableTo: ["TENANCY_DEPOSIT"] },
      { section: "s.215", description: "Sanctions for non-compliance", applicableTo: ["TENANCY_DEPOSIT"] },
    ]
  },
  {
    shortName: "CCA 1984",
    fullName: "County Courts Act 1984",
    year: 1984,
    relevantSections: [
      { section: "s.69", description: "Power to award interest on debts and damages", applicableTo: ["DEBT_RECOVERY", "UNPAID_INVOICE", "BREACH_OF_CONTRACT"] },
    ]
  },
  {
    shortName: "LPCDA 1998",
    fullName: "Late Payment of Commercial Debts (Interest) Act 1998",
    year: 1998,
    relevantSections: [
      { section: "s.1", description: "Statutory interest on qualifying debts", applicableTo: ["UNPAID_INVOICE", "B2B_DISPUTE"] },
      { section: "s.4", description: "Rate of statutory interest (8% + Bank of England base rate)", applicableTo: ["UNPAID_INVOICE", "B2B_DISPUTE"] },
      { section: "s.5A", description: "Compensation for late payment (£40-£100)", applicableTo: ["UNPAID_INVOICE", "B2B_DISPUTE"] },
    ]
  },
  // Benefits & Welfare
  {
    shortName: "WRA 2012",
    fullName: "Welfare Reform Act 2012",
    year: 2012,
    relevantSections: [
      { section: "s.1", description: "Universal Credit introduction", applicableTo: ["BENEFITS", "UNIVERSAL_CREDIT"] },
      { section: "s.11", description: "Work-related requirements", applicableTo: ["BENEFITS", "UNIVERSAL_CREDIT", "SANCTIONS"] },
      { section: "s.26", description: "Sanctions", applicableTo: ["BENEFITS", "SANCTIONS"] },
    ]
  },
  {
    shortName: "SSAA 1992",
    fullName: "Social Security Administration Act 1992",
    year: 1992,
    relevantSections: [
      { section: "s.71", description: "Overpayment recovery", applicableTo: ["BENEFITS", "OVERPAYMENT"] },
      { section: "s.12", description: "Mandatory reconsideration", applicableTo: ["BENEFITS", "APPEAL"] },
    ]
  },
  {
    shortName: "SSCBA 1992",
    fullName: "Social Security Contributions and Benefits Act 1992",
    year: 1992,
    relevantSections: [
      { section: "s.71", description: "Disability Living Allowance", applicableTo: ["BENEFITS", "DLA"] },
      { section: "s.72", description: "Care component of DLA", applicableTo: ["BENEFITS", "DLA", "PIP"] },
      { section: "s.73", description: "Mobility component of DLA", applicableTo: ["BENEFITS", "DLA", "PIP"] },
    ]
  },
  // Immigration
  {
    shortName: "IA 2014",
    fullName: "Immigration Act 2014",
    year: 2014,
    relevantSections: [
      { section: "s.33", description: "Article 8: public interest considerations", applicableTo: ["IMMIGRATION", "ARTICLE_8", "HUMAN_RIGHTS"] },
      { section: "s.19", description: "Landlord penalties for illegal immigrants", applicableTo: ["IMMIGRATION", "RIGHT_TO_RENT"] },
    ]
  },
  {
    shortName: "NIAA 2002",
    fullName: "Nationality, Immigration and Asylum Act 2002",
    year: 2002,
    relevantSections: [
      { section: "s.82", description: "Right of appeal to tribunal", applicableTo: ["IMMIGRATION", "APPEAL", "VISA"] },
      { section: "s.84", description: "Grounds of appeal", applicableTo: ["IMMIGRATION", "APPEAL"] },
      { section: "s.117B", description: "Public interest in Article 8 cases", applicableTo: ["IMMIGRATION", "ARTICLE_8"] },
    ]
  },
  {
    shortName: "HRA 1998",
    fullName: "Human Rights Act 1998",
    year: 1998,
    relevantSections: [
      { section: "Article 3", description: "Prohibition of torture", applicableTo: ["IMMIGRATION", "ASYLUM", "HUMAN_RIGHTS"] },
      { section: "Article 8", description: "Right to respect for private and family life", applicableTo: ["IMMIGRATION", "HUMAN_RIGHTS", "ARTICLE_8"] },
    ]
  },
  // Road Traffic & Insurance
  {
    shortName: "RTA 1988",
    fullName: "Road Traffic Act 1988",
    year: 1988,
    relevantSections: [
      { section: "s.143", description: "Users of motor vehicles to be insured", applicableTo: ["NO_INSURANCE", "MOTORING"] },
      { section: "s.144", description: "Exceptions from requirement of insurance", applicableTo: ["NO_INSURANCE"] },
      { section: "s.89", description: "Speeding offences", applicableTo: ["SPEEDING", "MOTORING"] },
      { section: "s.172", description: "Duty to give information as to identity of driver", applicableTo: ["SPEEDING", "NIP", "MOTORING"] },
    ]
  },
  {
    shortName: "RTOA 1988",
    fullName: "Road Traffic Offenders Act 1988",
    year: 1988,
    relevantSections: [
      { section: "s.1", description: "Requirement of warning of prosecution (NIP)", applicableTo: ["SPEEDING", "NIP", "MOTORING"] },
      { section: "s.35", description: "Disqualification for repeated offences (totting up)", applicableTo: ["SPEEDING", "TOTTING_UP", "DISQUALIFICATION"] },
      { section: "s.34", description: "Mitigating circumstances for disqualification", applicableTo: ["SPEEDING", "EXCEPTIONAL_HARDSHIP"] },
    ]
  },
  {
    shortName: "TMA 2004",
    fullName: "Traffic Management Act 2004",
    year: 2004,
    relevantSections: [
      { section: "s.72", description: "Civil enforcement of parking contraventions", applicableTo: ["PARKING", "PCN"] },
      { section: "s.78", description: "Representations against penalty charge", applicableTo: ["PARKING", "PCN", "APPEAL"] },
      { section: "s.81", description: "Appeals to adjudicator", applicableTo: ["PARKING", "APPEAL"] },
    ]
  },
  {
    shortName: "POFA 2012",
    fullName: "Protection of Freedoms Act 2012",
    year: 2012,
    relevantSections: [
      { section: "Sch 4", description: "Keeper liability for private parking", applicableTo: ["PARKING", "PRIVATE_PARKING", "KEEPER_LIABILITY"] },
    ]
  },
  // Insurance
  {
    shortName: "IA 2015",
    fullName: "Insurance Act 2015",
    year: 2015,
    relevantSections: [
      { section: "s.3", description: "Duty of fair presentation", applicableTo: ["INSURANCE", "DISCLOSURE"] },
      { section: "s.8", description: "Remedies for breach (proportionate)", applicableTo: ["INSURANCE", "MISREPRESENTATION"] },
      { section: "s.13A", description: "Damages for late payment", applicableTo: ["INSURANCE", "CLAIMS"] },
    ]
  },
  {
    shortName: "CIDRA 2012",
    fullName: "Consumer Insurance (Disclosure and Representations) Act 2012",
    year: 2012,
    relevantSections: [
      { section: "s.2", description: "Duty to take reasonable care not to misrepresent", applicableTo: ["INSURANCE", "CONSUMER_INSURANCE", "MISREPRESENTATION"] },
      { section: "s.4", description: "Classification of qualifying misrepresentations", applicableTo: ["INSURANCE", "MISREPRESENTATION"] },
      { section: "Sch 1", description: "Insurer's remedies for misrepresentation", applicableTo: ["INSURANCE", "MISREPRESENTATION"] },
    ]
  },
];

// ============================================================================
// CASE SELECTION HELPERS
// ============================================================================

/**
 * Get relevant case citations for a dispute type
 */
export function getCasesForDisputeType(disputeType: string): CaseCitation[] {
  const allCases = [
    ...CONSUMER_CASES,
    ...EMPLOYMENT_CASES,
    ...CONTRACT_CASES,
    ...TENANCY_CASES,
    ...PROFESSIONAL_CASES,
    ...BENEFITS_CASES,
    ...IMMIGRATION_CASES,
    ...INSURANCE_CASES,
    ...MOTORING_CASES,
  ];
  
  return allCases.filter(c => 
    c.applicableTo.some(type => 
      disputeType.toUpperCase().includes(type) || 
      type.includes(disputeType.toUpperCase())
    )
  );
}

/**
 * Get relevant statutes for a dispute type
 */
export function getStatutesForDisputeType(disputeType: string): { statute: StatuteReference; sections: typeof KEY_STATUTES[0]['relevantSections'] }[] {
  const results: { statute: StatuteReference; sections: typeof KEY_STATUTES[0]['relevantSections'] }[] = [];
  
  for (const statute of KEY_STATUTES) {
    const relevantSections = statute.relevantSections.filter(s =>
      s.applicableTo.some(type => 
        disputeType.toUpperCase().includes(type) || 
        type.includes(disputeType.toUpperCase())
      )
    );
    
    if (relevantSections.length > 0) {
      results.push({ statute, sections: relevantSections });
    }
  }
  
  return results;
}

/**
 * Format case citation for use in documents
 */
export function formatCitation(caseCitation: CaseCitation): string {
  return `${caseCitation.name} ${caseCitation.citation}`;
}

/**
 * Format case citation with holding for Letter Before Action
 */
export function formatCitationWithHolding(caseCitation: CaseCitation): string {
  return `${caseCitation.name} ${caseCitation.citation} (${caseCitation.holding.toLowerCase()})`;
}

/**
 * Get primary case for a legal principle
 */
export function getPrimaryCaseForPrinciple(principle: string): CaseCitation | undefined {
  const allCases = [
    ...CONSUMER_CASES,
    ...EMPLOYMENT_CASES,
    ...CONTRACT_CASES,
    ...TENANCY_CASES,
  ];
  
  return allCases.find(c => 
    c.principle.toLowerCase().includes(principle.toLowerCase()) ||
    c.keywords.some(k => principle.toLowerCase().includes(k))
  );
}

/**
 * Build legal basis section with citations
 */
export function buildLegalBasisWithCitations(
  disputeType: string,
  specificClaims: string[]
): string {
  const cases = getCasesForDisputeType(disputeType);
  const statutes = getStatutesForDisputeType(disputeType);
  
  let legalBasis = "LEGAL BASIS:\n\n";
  
  // Add statutory basis
  if (statutes.length > 0) {
    legalBasis += "Statutory Framework:\n";
    for (const { statute, sections } of statutes) {
      legalBasis += `\n${statute.fullName} ${statute.year}:\n`;
      for (const section of sections) {
        legalBasis += `  • ${section.section}: ${section.description}\n`;
      }
    }
  }
  
  // Add case law
  if (cases.length > 0) {
    legalBasis += "\nRelevant Case Law:\n";
    for (const caseCitation of cases.slice(0, 3)) { // Top 3 most relevant
      legalBasis += `\n• ${formatCitation(caseCitation)}\n`;
      legalBasis += `  "${caseCitation.holding}"\n`;
    }
  }
  
  return legalBasis;
}

// ============================================================================
// EXPORT CONVENIENCE FUNCTIONS
// ============================================================================

// ============================================================================
// BENEFITS & WELFARE CASES
// ============================================================================

export const BENEFITS_CASES: CaseCitation[] = [
  {
    name: "R (Connor) v Secretary of State for Work and Pensions",
    year: 2020,
    court: "High Court",
    citation: "[2020] EWHC 1999 (Admin)",
    holding: "Universal Credit two-child limit discriminated against women and children",
    principle: "Two-child limit challenge",
    applicableTo: ["BENEFITS", "UNIVERSAL_CREDIT", "DISCRIMINATION"],
    keywords: ["universal credit", "two-child limit", "discrimination"]
  },
  {
    name: "R (Johnson) v Secretary of State for Work and Pensions",
    year: 2020,
    court: "Court of Appeal",
    citation: "[2020] EWCA Civ 778",
    holding: "Bedroom tax exemption for foster carers did not have to extend to kinship carers",
    principle: "Bedroom tax and foster care",
    applicableTo: ["BENEFITS", "HOUSING_BENEFIT", "BEDROOM_TAX"],
    keywords: ["bedroom tax", "foster care", "housing benefit"]
  },
  {
    name: "R (Carmichael) v Secretary of State for Work and Pensions",
    year: 2016,
    court: "Supreme Court",
    citation: "[2016] UKSC 58",
    holding: "Bedroom tax discriminated against disabled people who needed extra room for overnight carers",
    principle: "Bedroom tax disability discrimination",
    applicableTo: ["BENEFITS", "HOUSING_BENEFIT", "DISABILITY"],
    keywords: ["bedroom tax", "disability", "discrimination"]
  },
  {
    name: "Kerr v Department for Social Development",
    year: 2004,
    court: "House of Lords",
    citation: "[2004] UKHL 23",
    holding: "Inquisitorial approach in benefits tribunals means tribunal should assist claimant to present case",
    principle: "Tribunal's inquisitorial duty",
    applicableTo: ["BENEFITS", "TRIBUNAL"],
    keywords: ["tribunal", "inquisitorial", "assistance"]
  },
  {
    name: "R (Reilly) v Secretary of State for Work and Pensions",
    year: 2013,
    court: "Court of Appeal",
    citation: "[2013] EWCA Civ 66",
    holding: "Workfare regulations requiring unpaid work were unlawful for lack of proper notice",
    principle: "Workfare and mandatory unpaid work",
    applicableTo: ["BENEFITS", "JSA", "WORKFARE"],
    keywords: ["workfare", "JSA", "sanctions", "unpaid work"]
  },
  {
    name: "Secretary of State v MM (DLA)",
    year: 2011,
    court: "Upper Tribunal",
    citation: "[2011] UKUT 334 (AAC)",
    holding: "Supervision requirement for DLA can be met even if supervision not actually provided",
    principle: "DLA supervision needs assessment",
    applicableTo: ["BENEFITS", "DLA", "PIP"],
    keywords: ["DLA", "supervision", "care needs"]
  },
  {
    name: "R (RF) v Secretary of State for Work and Pensions",
    year: 2017,
    court: "High Court",
    citation: "[2017] EWHC 3375 (Admin)",
    holding: "PIP assessment descriptors for mental health conditions were lawful",
    principle: "PIP mental health assessment",
    applicableTo: ["BENEFITS", "PIP", "MENTAL_HEALTH"],
    keywords: ["PIP", "mental health", "assessment"]
  },
  {
    name: "Howker v Secretary of State for Work and Pensions",
    year: 2002,
    court: "Court of Appeal",
    citation: "[2002] EWCA Civ 1623",
    holding: "Claimant must show actual difficulty with activity, not just theoretical limitation",
    principle: "Functional assessment in disability benefits",
    applicableTo: ["BENEFITS", "DLA", "PIP", "ESA"],
    keywords: ["functional", "disability", "assessment", "actual difficulty"]
  },
];

// ============================================================================
// IMMIGRATION & VISA CASES
// ============================================================================

export const IMMIGRATION_CASES: CaseCitation[] = [
  {
    name: "R (Agyarko) v Secretary of State for the Home Department",
    year: 2017,
    court: "Supreme Court",
    citation: "[2017] UKSC 11",
    holding: "Genuine and subsisting relationship alone insufficient for Article 8 to succeed against removal",
    principle: "Article 8 proportionality in removal cases",
    applicableTo: ["IMMIGRATION", "VISA", "HUMAN_RIGHTS", "ARTICLE_8"],
    keywords: ["Article 8", "removal", "family life", "proportionality"]
  },
  {
    name: "Chikwamba v Secretary of State for the Home Department",
    year: 2008,
    court: "House of Lords",
    citation: "[2008] UKHL 40",
    holding: "Normally no need to return home to apply for entry clearance if application would succeed",
    principle: "Chikwamba principle on return requirement",
    applicableTo: ["IMMIGRATION", "VISA", "ENTRY_CLEARANCE"],
    keywords: ["entry clearance", "return", "out-of-country application"]
  },
  {
    name: "R (Razgar) v Secretary of State for the Home Department",
    year: 2004,
    court: "House of Lords",
    citation: "[2004] UKHL 27",
    holding: "Five-stage test for Article 8 claims: engagement, accordance with law, legitimate aim, necessity, proportionality",
    principle: "Razgar five-stage Article 8 test",
    applicableTo: ["IMMIGRATION", "HUMAN_RIGHTS", "ARTICLE_8"],
    keywords: ["Article 8", "five-stage test", "proportionality"]
  },
  {
    name: "Huang v Secretary of State for the Home Department",
    year: 2007,
    court: "House of Lords",
    citation: "[2007] UKHL 11",
    holding: "Immigration rules are starting point but not conclusive for Article 8; case-specific assessment required",
    principle: "Immigration rules and Article 8 relationship",
    applicableTo: ["IMMIGRATION", "HUMAN_RIGHTS", "ARTICLE_8"],
    keywords: ["immigration rules", "Article 8", "proportionality"]
  },
  {
    name: "R (Quila) v Secretary of State for the Home Department",
    year: 2011,
    court: "Supreme Court",
    citation: "[2011] UKSC 45",
    holding: "21-year minimum age for spouse visas was disproportionate interference with right to marry",
    principle: "Age requirement for spouse visas",
    applicableTo: ["IMMIGRATION", "VISA", "SPOUSE_VISA"],
    keywords: ["spouse visa", "age requirement", "Article 8"]
  },
  {
    name: "Patel v Secretary of State for the Home Department",
    year: 2013,
    court: "Supreme Court",
    citation: "[2013] UKSC 72",
    holding: "Minor procedural errors by applicant may warrant opportunity to correct before refusal",
    principle: "Evidential flexibility in immigration applications",
    applicableTo: ["IMMIGRATION", "VISA", "PROCEDURAL_FAIRNESS"],
    keywords: ["evidential flexibility", "procedural fairness", "documents"]
  },
  {
    name: "R (Limbuela) v Secretary of State for the Home Department",
    year: 2005,
    court: "House of Lords",
    citation: "[2005] UKHL 66",
    holding: "Denying asylum seekers support to point of destitution breaches Article 3",
    principle: "Destitution of asylum seekers",
    applicableTo: ["IMMIGRATION", "ASYLUM", "HUMAN_RIGHTS"],
    keywords: ["asylum", "destitution", "Article 3", "support"]
  },
  {
    name: "ZH (Tanzania) v Secretary of State for the Home Department",
    year: 2011,
    court: "Supreme Court",
    citation: "[2011] UKSC 4",
    holding: "Best interests of child must be primary consideration in immigration decisions affecting children",
    principle: "Best interests of child in immigration",
    applicableTo: ["IMMIGRATION", "CHILDREN", "ARTICLE_8"],
    keywords: ["best interests", "child", "primary consideration"]
  },
  {
    name: "R (AM) v Secretary of State for the Home Department",
    year: 2021,
    court: "Court of Appeal",
    citation: "[2021] EWCA Civ 1710",
    holding: "Long residence rule requires continuous lawful residence; periods of overstaying break continuity",
    principle: "Long residence and continuous lawful residence",
    applicableTo: ["IMMIGRATION", "LONG_RESIDENCE", "ILR"],
    keywords: ["long residence", "ILR", "continuous residence", "lawful"]
  },
];

// ============================================================================
// INSURANCE CASES
// ============================================================================

export const INSURANCE_CASES: CaseCitation[] = [
  {
    name: "Carter v Boehm",
    year: 1766,
    court: "King's Bench",
    citation: "(1766) 3 Burr 1905",
    holding: "Insurance contracts require utmost good faith (uberrimae fidei) from both parties",
    principle: "Duty of utmost good faith in insurance",
    applicableTo: ["INSURANCE", "MISREPRESENTATION"],
    keywords: ["utmost good faith", "disclosure", "insurance"]
  },
  {
    name: "Pan Atlantic Insurance v Pine Top Insurance",
    year: 1995,
    court: "House of Lords",
    citation: "[1995] 1 AC 501",
    holding: "Material non-disclosure must have induced the insurer to enter contract on those terms",
    principle: "Inducement test for non-disclosure",
    applicableTo: ["INSURANCE", "NON_DISCLOSURE"],
    keywords: ["non-disclosure", "inducement", "material fact"]
  },
  {
    name: "Castellain v Preston",
    year: 1883,
    court: "Court of Appeal",
    citation: "(1883) 11 QBD 380",
    holding: "Insurance is a contract of indemnity; insured cannot profit from loss",
    principle: "Principle of indemnity",
    applicableTo: ["INSURANCE", "INDEMNITY"],
    keywords: ["indemnity", "profit", "insurance claim"]
  },
  {
    name: "Sprung v Royal Insurance (UK)",
    year: 1999,
    court: "Court of Appeal",
    citation: "[1999] Lloyd's Rep IR 111",
    holding: "Insurer cannot rely on breach of condition precedent if breach did not prejudice them",
    principle: "Prejudice requirement for condition breach",
    applicableTo: ["INSURANCE", "POLICY_BREACH"],
    keywords: ["condition precedent", "prejudice", "breach"]
  },
  {
    name: "Versloot Dredging v HDI Gerling",
    year: 2016,
    court: "Supreme Court",
    citation: "[2016] UKSC 45",
    holding: "Collateral lies (lies about already-valid claim) do not forfeit entire insurance claim",
    principle: "Collateral lie rule in insurance claims",
    applicableTo: ["INSURANCE", "FRAUD", "CLAIMS"],
    keywords: ["collateral lie", "fraud", "forfeiture"]
  },
  {
    name: "Milton Keynes BC v Nulty",
    year: 2013,
    court: "Court of Appeal",
    citation: "[2013] EWCA Civ 15",
    holding: "In fire insurance claims, balance of probabilities applies; no heightened standard for serious allegations",
    principle: "Standard of proof in insurance claims",
    applicableTo: ["INSURANCE", "FIRE", "CLAIMS"],
    keywords: ["standard of proof", "fire", "balance of probabilities"]
  },
];

// ============================================================================
// MOTORING & TRAFFIC CASES
// ============================================================================

export const MOTORING_CASES: CaseCitation[] = [
  // No Insurance
  {
    name: "DPP v Hay",
    year: 2005,
    court: "Queen's Bench Division",
    citation: "[2005] EWHC 1395 (Admin)",
    holding: "Belief that vehicle was insured is not a defence unless defendant took reasonable steps to verify",
    principle: "Reasonable belief defence for no insurance",
    applicableTo: ["NO_INSURANCE", "MOTORING"],
    keywords: ["no insurance", "reasonable belief", "defence"]
  },
  {
    name: "R v Bowsher",
    year: 1973,
    court: "Court of Appeal",
    citation: "[1973] RTR 202",
    holding: "Special reasons for not endorsing include emergency use and genuine belief of cover",
    principle: "Special reasons for no insurance",
    applicableTo: ["NO_INSURANCE", "SPECIAL_REASONS"],
    keywords: ["special reasons", "no insurance", "endorsement"]
  },
  {
    name: "MIB v Lewis",
    year: 2019,
    court: "Supreme Court",
    citation: "[2019] UKSC 16",
    holding: "MIB must compensate even where vehicle was on private land if accident resulted from vehicle use",
    principle: "MIB liability on private land",
    applicableTo: ["NO_INSURANCE", "MIB", "MOTOR_ACCIDENT"],
    keywords: ["MIB", "uninsured", "private land", "compensation"]
  },
  
  // Speeding
  {
    name: "DPP v Whittaker",
    year: 2014,
    court: "Queen's Bench Division",
    citation: "[2014] EWHC 3263 (Admin)",
    holding: "Speed camera evidence admissible without operator testimony if device approved and calibrated",
    principle: "Speed camera evidence admissibility",
    applicableTo: ["SPEEDING", "TRAFFIC"],
    keywords: ["speed camera", "evidence", "calibration"]
  },
  {
    name: "Whiteside v DPP",
    year: 2011,
    court: "Queen's Bench Division",
    citation: "[2011] EWHC 3471 (Admin)",
    holding: "Emergency not a defence to speeding; may be mitigation only",
    principle: "Emergency defence to speeding",
    applicableTo: ["SPEEDING", "TRAFFIC", "EMERGENCY"],
    keywords: ["speeding", "emergency", "defence", "mitigation"]
  },
  {
    name: "Connell v DPP",
    year: 2011,
    court: "Queen's Bench Division",
    citation: "[2011] EWHC 158 (Admin)",
    holding: "Driver must be served with NIP within 14 days; late service invalidates prosecution",
    principle: "14-day NIP requirement",
    applicableTo: ["SPEEDING", "TRAFFIC", "NIP"],
    keywords: ["NIP", "14 days", "service", "speeding"]
  },
  {
    name: "R v Ashford & Tenterden Magistrates",
    year: 1998,
    court: "Queen's Bench Division",
    citation: "[1998] EWHC Admin 359",
    holding: "Hardship alone insufficient for exceptional hardship; must be truly exceptional circumstances",
    principle: "Exceptional hardship for totting up",
    applicableTo: ["SPEEDING", "TOTTING_UP", "DISQUALIFICATION"],
    keywords: ["exceptional hardship", "totting up", "disqualification"]
  },
  
  // Parking
  {
    name: "ParkingEye v Beavis",
    year: 2015,
    court: "Supreme Court",
    citation: "[2015] UKSC 67",
    holding: "Private parking charge of £85 was enforceable and not an unenforceable penalty",
    principle: "Private parking charges enforceability",
    applicableTo: ["PARKING", "PRIVATE_PARKING", "PCN"],
    keywords: ["parking", "penalty", "private land", "ParkingEye"]
  },
  {
    name: "Vehicle Control Services v HMRC",
    year: 2013,
    court: "Court of Appeal",
    citation: "[2013] EWCA Civ 186",
    holding: "Parking charges on private land are not penalties if they have legitimate interest beyond deterrence",
    principle: "Legitimate interest in parking charges",
    applicableTo: ["PARKING", "PRIVATE_PARKING"],
    keywords: ["parking charge", "legitimate interest", "penalty"]
  },
  {
    name: "R (Herrington) v Parking Adjudicator",
    year: 2015,
    court: "Queen's Bench Division",
    citation: "[2015] EWHC 1547 (Admin)",
    holding: "Penalty charge notice must be served on registered keeper; errors in procedure can invalidate",
    principle: "PCN service requirements",
    applicableTo: ["PARKING", "PCN", "COUNCIL_PARKING"],
    keywords: ["PCN", "service", "registered keeper"]
  },
  {
    name: "Jopson v Homeguard Services",
    year: 2016,
    court: "County Court",
    citation: "[2016] unreported",
    holding: "Private parking company must prove keeper liability under POFA 2012 with proper signage",
    principle: "Keeper liability under POFA 2012",
    applicableTo: ["PARKING", "PRIVATE_PARKING", "KEEPER_LIABILITY"],
    keywords: ["POFA", "keeper liability", "signage", "private parking"]
  },
];

export const UK_CASE_LAW = {
  consumer: CONSUMER_CASES,
  employment: EMPLOYMENT_CASES,
  contract: CONTRACT_CASES,
  tenancy: TENANCY_CASES,
  professional: PROFESSIONAL_CASES,
  benefits: BENEFITS_CASES,
  immigration: IMMIGRATION_CASES,
  insurance: INSURANCE_CASES,
  motoring: MOTORING_CASES,
  statutes: KEY_STATUTES,
  getCasesForDisputeType,
  getStatutesForDisputeType,
  formatCitation,
  formatCitationWithHolding,
  getPrimaryCaseForPrinciple,
  buildLegalBasisWithCitations,
};

export default UK_CASE_LAW;
