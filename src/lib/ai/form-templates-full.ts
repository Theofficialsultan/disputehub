/**
 * COMPREHENSIVE UK LEGAL FORM TEMPLATES
 * 
 * This file contains detailed prompt templates for ALL major UK legal forms
 * across all dispute categories. System 3 uses these to generate accurate,
 * form-specific documents.
 * 
 * Based on research from GOV.UK, HMCTS, and official tribunal sources.
 * Last updated: January 2026
 */

import type { CaseStrategy, EvidenceItem } from "@prisma/client";
import type { OfficialFormID } from "@/lib/legal/form-registry";
import type { RoutingDecision } from "@/lib/legal/routing-types";
import { LEGAL_ACCURACY_RULES, determineEmploymentStatus, getUnpaidMoneyTerminology } from "./legal-accuracy-rules";

// Import Tier 1 and Tier 2 templates
import { TIER_1_TEMPLATES } from "./form-templates-tier1";
import { TIER_2_TEMPLATES } from "./form-templates-tier2";

// ============================================================================
// TEMPLATE BUILDER TYPES
// ============================================================================

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
}

export interface FormTemplateContext {
  formId: OfficialFormID;
  routingDecision: RoutingDecision;
  strategy: CaseStrategy;
  evidence: EvidenceItem[];
  caseTitle: string;
  today: string;
  facts: string[];
  user: UserProfile;
}

// Helper to format user details for documents
export function formatUserDetails(user: UserProfile): {
  fullName: string;
  fullAddress: string;
  contactBlock: string;
} {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '[YOUR NAME]';
  
  const addressParts = [
    user.addressLine1,
    user.addressLine2,
    user.city,
    user.postcode
  ].filter(Boolean);
  
  const fullAddress = addressParts.length > 0 
    ? addressParts.join('\n') 
    : '[YOUR ADDRESS]\n[YOUR CITY]\n[YOUR POSTCODE]';
  
  const contactBlock = `${fullName}
${fullAddress}
${user.email || '[YOUR EMAIL]'}
${user.phone || '[YOUR PHONE]'}`;

  return { fullName, fullAddress, contactBlock };
}

export type FormTemplateBuilder = (ctx: FormTemplateContext) => string;

// ============================================================================
// MAIN TEMPLATE REGISTRY
// ============================================================================

export const FORM_TEMPLATES: Partial<Record<OfficialFormID, FormTemplateBuilder>> = {
  
  // ==========================================================================
  // EMPLOYMENT TRIBUNAL FORMS
  // ==========================================================================
  
  "UK-ET1-EMPLOYMENT-TRIBUNAL-2024": (ctx) => {
    const claimantName = extractClaimantName(ctx.strategy, ctx.user) || "[CLAIMANT NAME]";
    const claimantAddress = ctx.user.addressLine1 || "[ADDRESS]";
    const claimantCity = ctx.user.city || "[CITY]";
    const claimantPostcode = ctx.user.postcode || "[POSTCODE]";
    const claimantEmail = ctx.user.email || "[EMAIL]";
    const respondentName = extractEmployerName(ctx.strategy) || "[RESPONDENT NAME]";
    
    return `
Generate an official UK Employment Tribunal Claim Form (ET1).

This must match the structure of the official ET1 form (last updated March 2024).

FORMAT EXACTLY AS FOLLOWS:

╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║                           EMPLOYMENT TRIBUNAL                               ║
║                                                                             ║
║                    CLAIM FORM (ET1)                                         ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  Case Number: [To be allocated by Tribunal]                                 ║
║                                                                             ║
║  BETWEEN:                                                                   ║
║                                                                             ║
║                         ${claimantName.toUpperCase().padEnd(49)}║
║                                                              Claimant       ║
║                                                                             ║
║                                    - and -                                  ║
║                                                                             ║
║                         ${respondentName.toUpperCase().padEnd(49)}║
║                                                              Respondent     ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

Date prepared: ${ctx.today}

IMPORTANT: This form is based on the official ET1 format. Complete all sections 
marked [User to complete]. Submit online at: www.gov.uk/employment-tribunals

┌─────────────────────────────────────────────────────────────────────────────┐
│  SECTION 1: CLAIMANT DETAILS                                                │
└─────────────────────────────────────────────────────────────────────────────┘

1.1 Title: ☐ Mr ☐ Mrs ☐ Miss ☐ Ms ☐ Other: _______

1.2 First name(s): _______________________________

1.3 Surname: ____________________________________

1.4 Date of birth: ____/____/________ (DD/MM/YYYY)

1.5 Address:
    House/Flat number: _______________________________
    Street: __________________________________________
    Town/City: _______________________________________
    County: __________________________________________
    Postcode: ________________________________________

1.6 Phone number: ____________________________________

1.7 Alternative phone number: ________________________

1.8 Email address: ___________________________________

1.9 Preferred contact method: ☐ Email ☐ Post ☐ Phone

1.10 What sex were you registered as at birth?
     ☐ Male ☐ Female ☐ Prefer not to say

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: ACAS EARLY CONCILIATION
═══════════════════════════════════════════════════════════════════════════════

2.1 Do you have an ACAS early conciliation certificate number?
    ☐ Yes (continue to 2.2)
    ☐ No - you must contact ACAS before proceeding (some exemptions apply)

2.2 ACAS early conciliation certificate number: _______________________

IMPORTANT: In most cases, you MUST notify ACAS before making a claim. Get your certificate at: www.acas.org.uk/notify

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: RESPONDENT (EMPLOYER) DETAILS
═══════════════════════════════════════════════════════════════════════════════

3.1 Give the name of your employer or the organisation you are claiming against:

${extractEmployerName(ctx.strategy) || "[Employer name - complete from case facts]"}

3.2 Address:
    ${extractEmployerAddress(ctx.strategy) || `[Complete employer address:
    Building/number: _______________________________
    Street: ________________________________________
    Town/City: _____________________________________
    County: ________________________________________
    Postcode: ______________________________________]`}

3.3 Phone number: ____________________________________

3.4 Type of employer's business:
    ${extractBusinessType(ctx.strategy) || "[e.g., retail, manufacturing, public sector]"}

3.5 How many people work (or worked) for the respondent?
    ☐ Fewer than 10  ☐ 10 to 49  ☐ 50 to 249  ☐ 250 or more  ☐ Don't know

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: EMPLOYMENT DETAILS
═══════════════════════════════════════════════════════════════════════════════

4.1 What was your job title? ${extractJobTitle(ctx.strategy) || "[User to complete]"}

4.2 When did you start working for the respondent? ${extractStartDate(ctx.strategy) || "____/____/________"}

4.3 Is your employment continuing? ${determineEmploymentContinuing(ctx.strategy)}

4.4 If your employment has ended, when did it end? ${extractEndDate(ctx.strategy) || "____/____/________ or N/A"}

4.5 What is (or was) your average weekly working hours? ${extractWorkingHours(ctx.strategy) || "_______ hours"}

4.6 Pay details:
    • How often are/were you paid? ☐ Weekly ☐ Monthly ☐ Other: _______
    • Gross pay (before tax): £_______ per [week/month]
    • Net pay (take-home): £_______ per [week/month]

4.7 Were you working under a permanent contract?
    ☐ Yes (permanent)  ☐ No (fixed-term)  ☐ No (agency)  ☐ Other: _______

4.8 What is/was your notice period? _______ [weeks/months]

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: TYPE OF CLAIM
═══════════════════════════════════════════════════════════════════════════════

5.1 Please tick the type(s) of claim you are making:

${determineClaimTypes(ctx.strategy, ctx.facts)}

If claiming discrimination, specify the protected characteristic(s):
☐ Age  ☐ Disability  ☐ Gender reassignment  ☐ Marriage/civil partnership
☐ Pregnancy/maternity  ☐ Race  ☐ Religion/belief  ☐ Sex  ☐ Sexual orientation

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: WHAT HAPPENED (DETAILS OF YOUR CLAIM)
═══════════════════════════════════════════════════════════════════════════════

6.1 Please give the background and details of your claim:

IMPORTANT: Write in first person ("I"), be factual and chronological, and include specific dates and events.

${generateEmploymentClaimNarrative(ctx.strategy, ctx.evidence, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 7: WHAT YOU WANT THE TRIBUNAL TO ORDER
═══════════════════════════════════════════════════════════════════════════════

7.1 What would you like the tribunal to order the respondent to do?

${ctx.strategy.desiredOutcome || "[Specify your desired remedy - e.g., compensation, reinstatement, re-engagement, declaration, etc.]"}

7.2 If you are seeking compensation, state the amount (if known):

£${extractCompensationAmount(ctx.strategy) || "_______"} (if unsure, you can complete a Schedule of Loss later)

7.3 Do you want the tribunal to reinstate you (give you your old job back)?
    ☐ Yes  ☐ No  ☐ Not applicable

7.4 Do you want the tribunal to re-engage you (give you another job with the same employer)?
    ☐ Yes  ☐ No  ☐ Not applicable

═══════════════════════════════════════════════════════════════════════════════
SECTION 8: INFORMATION TO REGULATORS (OPTIONAL)
═══════════════════════════════════════════════════════════════════════════════

8.1 Your claim may involve issues that should be drawn to the attention of a regulator (e.g., Equality and Human Rights Commission). Do you want a copy of this form sent to a regulator?

    ☐ Yes (specify which): _______________________________
    ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 9: DISABILITY
═══════════════════════════════════════════════════════════════════════════════

9.1 Do you have a disability that means you need assistance at the tribunal or hearing?
    ☐ Yes (please specify requirements below)
    ☐ No

If yes, please explain what assistance you need:
_________________________________________________________________

═══════════════════════════════════════════════════════════════════════════════
SECTION 10: ADDITIONAL INFORMATION
═══════════════════════════════════════════════════════════════════════════════

10.1 Is there any other information you wish to provide?

${ctx.evidence.length > 0 ? `I am submitting the following evidence in support of my claim:
${ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n")}

This evidence is contained in a separate evidence bundle.` : "[Add any additional information here]"}

═══════════════════════════════════════════════════════════════════════════════
DECLARATION AND SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

I confirm that the information I have given on this form is correct and complete to the best of my knowledge and belief.

I understand that:
• I must notify ACAS before making most claims (with some exceptions)
• I must pay attention to time limits for making a claim
• Proceedings for contempt of court may be brought against anyone who makes a false statement without an honest belief in its truth
• The tribunal may reject my claim if I do not comply with the rules

Signature: _______________________________

Print name: ______________________________

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
SUBMISSION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

You can submit this claim:
• Online (preferred): www.employmenttribunals.service.gov.uk
• By post: Employment Tribunal Central Office (England & Wales)
           PO Box 10218, Leicester, LE1 8EG
• By email: (check regional tribunal office)

Attach: ACAS certificate, evidence bundle, Schedule of Loss (if applicable)

═══════════════════════════════════════════════════════════════════════════════
END OF FORM ET1
═══════════════════════════════════════════════════════════════════════════════
`;
  },

  // ==========================================================================
  // COUNTY COURT FORMS
  // ==========================================================================
  
  "UK-N1-COUNTY-COURT-CLAIM": (ctx) => {
    const claimantName = extractClaimantName(ctx.strategy, ctx.user) || "[CLAIMANT NAME]";
    const claimantAddress = ctx.user.addressLine1 || "[ADDRESS]";
    const claimantCity = ctx.user.city || "[CITY]";
    const claimantPostcode = ctx.user.postcode || "[POSTCODE]";
    const claimantEmail = ctx.user.email || "[EMAIL]";
    const defendantName = extractDefendantName(ctx.strategy) || "[DEFENDANT NAME]";
    const claimAmount = extractMonetaryAmount(ctx.strategy) || "_______";
    
    return `
Generate Particulars of Claim for a County Court N1 Claim Form.

This must follow CPR (Civil Procedure Rules) format with numbered paragraphs.

CRITICAL - FOLLOW THESE LEGAL ACCURACY RULES:

${LEGAL_ACCURACY_RULES}

FORMAT EXACTLY AS FOLLOWS:

╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║                    IN THE COUNTY COURT AT [LOCATION]                        ║
║                         COUNTY COURT MONEY CLAIMS CENTRE                    ║
║                                                                             ║
║  Claim Number: [To be allocated]                                            ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  BETWEEN:                                                                   ║
║                                                                             ║
║                         ${claimantName.toUpperCase().padEnd(49)}║
║                                                              Claimant       ║
║                                                                             ║
║                                    - and -                                  ║
║                                                                             ║
║                         ${defendantName.toUpperCase().padEnd(49)}║
║                                                              Defendant      ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║                          PARTICULARS OF CLAIM                               ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝


${generateParticularsOfClaim(ctx)}


╔═════════════════════════════════════════════════════════════════════════════╗
║  AND THE CLAIMANT CLAIMS:                                                   ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  (1) Payment of the sum of £${claimAmount.toString().padEnd(45)}║
║                                                                             ║
║  (2) Interest pursuant to section 69 of the County Courts Act 1984 at      ║
║      the rate of 8% per annum from [date debt became due] to the date      ║
║      of judgment, or such other rate and period as the court thinks fit    ║
║                                                                             ║
║  (3) Costs                                                                  ║
║                                                                             ║
║  (4) Such further or other relief as the court thinks fit                  ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════════
STATEMENT OF TRUTH
═══════════════════════════════════════════════════════════════════════════════

I believe that the facts stated in these Particulars of Claim are true. I 
understand that proceedings for contempt of court may be brought against anyone 
who makes, or causes to be made, a false statement in a document verified by a 
statement of truth without an honest belief in its truth.


Signed: ________________________________     Date: ${ctx.today}


Full name:  ${claimantName}

Position:   Claimant (Litigant in Person)


═══════════════════════════════════════════════════════════════════════════════
CLAIMANT'S ADDRESS FOR SERVICE
═══════════════════════════════════════════════════════════════════════════════

${claimantName}
${claimantAddress}
${claimantCity}
${claimantPostcode}

Email: ${claimantEmail}

═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  NOTES FOR FILING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  • This document is PARTICULARS OF CLAIM (attached to Form N1)              │
│  • The N1 form itself must be completed separately                          │
│  • File online at: www.moneyclaims.service.gov.uk                          │
│  • Or post to: County Court Money Claims Centre, PO Box 527, Salford M5 0BY│
│  • Court fee payable based on claim value                                   │
│  • Keep copies of all documents for your records                            │
└─────────────────────────────────────────────────────────────────────────────┘
`;
  },

  // ==========================================================================
  // LETTER BEFORE ACTION (LBA)
  // ==========================================================================
  
  "UK-LBA-GENERAL": (ctx) => {
    const claimantName = extractClaimantName(ctx.strategy, ctx.user) || "[CLAIMANT NAME]";
    const claimantAddress = ctx.user.addressLine1 || "[ADDRESS LINE 1]";
    const claimantCity = ctx.user.city || "[CITY]";
    const claimantPostcode = ctx.user.postcode || "[POSTCODE]";
    const claimantEmail = ctx.user.email || "[EMAIL]";
    const claimantPhone = ctx.user.phone || "";
    
    const defendantName = extractDefendantName(ctx.strategy) || "[DEFENDANT NAME]";
    const defendantAddress = extractEmployerAddress(ctx.strategy) || "[DEFENDANT ADDRESS]";
    
    const claimAmount = extractMonetaryAmount(ctx.strategy) || "_______";
    const caseRef = `LBA/${new Date().getFullYear()}/${ctx.caseTitle.substring(0, 6).toUpperCase().replace(/\s/g, '')}`;
    
    // Calculate 14-day deadline
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 14);
    const deadline = deadlineDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    return `
Generate a formal Letter Before Action (LBA) in accordance with the Pre-Action Protocol.

This letter must comply with the Civil Procedure Rules Pre-Action Protocol and give the recipient reasonable time to respond before court proceedings.

FORMAT EXACTLY AS FOLLOWS:

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ${claimantName.toUpperCase().padEnd(73)}│
│  ${claimantAddress.padEnd(73)}│
│  ${claimantCity.padEnd(73)}│
│  ${claimantPostcode.padEnd(73)}│
│  Email: ${claimantEmail.padEnd(66)}│
${claimantPhone ? `│  Tel: ${claimantPhone.padEnd(68)}│\n` : ''}│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

${defendantName}
${defendantAddress}

Date: ${ctx.today}
Our Ref: ${caseRef}

═══════════════════════════════════════════════════════════════════════════════
                         LETTER BEFORE ACTION
                    
                         RE: ${ctx.caseTitle.toUpperCase()}
                    
                    FORMAL NOTICE OF INTENDED LEGAL PROCEEDINGS
═══════════════════════════════════════════════════════════════════════════════

WITHOUT PREJUDICE SAVE AS TO COSTS
───────────────────────────────────────────────────────────────────────────────

Dear Sir/Madam,

┌─────────────────────────────────────────────────────────────────────────────┐
│  1. INTRODUCTION                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

I am writing to you in accordance with the Pre-Action Protocol for Debt Claims / 
Civil Claims to formally notify you of my claim against you.

This letter sets out the basis of my claim and what I require from you. If you 
fail to respond appropriately within the time limit specified below, I intend to 
commence court proceedings against you without further notice.

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. THE PARTIES                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

CLAIMANT:
Name:     ${claimantName}
Address:  ${claimantAddress}
          ${claimantCity}
          ${claimantPostcode}
Email:    ${claimantEmail}
${claimantPhone ? `Tel:      ${claimantPhone}` : ''}

DEFENDANT/RESPONDENT:
Name:     ${defendantName}
Address:  ${defendantAddress}

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. BACKGROUND AND FACTS                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

${generateLBAFactsSection(ctx.facts)}

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. THE CLAIM                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

${generateLBAClaimSection(ctx.strategy, ctx.facts)}

┌─────────────────────────────────────────────────────────────────────────────┐
│  5. LEGAL BASIS                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

My claim is based on the following legal grounds:

${generateLBALegalBasis(ctx.strategy, ctx.facts)}

┌─────────────────────────────────────────────────────────────────────────────┐
│  6. AMOUNT CLAIMED                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  SCHEDULE OF CLAIM                                            ║
╠═══════════════════════════════════════════════════════════════╣
║  Principal sum owed:              £${claimAmount.toString().padStart(15)}     ║
║  Interest (8% p.a. to date):      £${'[calculated]'.padStart(15)}     ║
╠═══════════════════════════════════════════════════════════════╣
║  TOTAL CLAIMED:                   £${claimAmount.toString().padStart(15)}     ║
╚═══════════════════════════════════════════════════════════════╝

Interest continues to accrue at the rate of 8% per annum (or such other rate 
as the court sees fit) until payment or judgment.

┌─────────────────────────────────────────────────────────────────────────────┐
│  7. EVIDENCE                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

I rely upon the following evidence in support of my claim:

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `  E${i + 1}. ${e.title || e.fileName}${e.description ? `\n      └─ ${e.description}` : ""}`).join("\n") : "[List evidence documents - contracts, invoices, correspondence, photos, etc.]"}

${ctx.evidence.length > 0 ? "\nCopies of the above evidence are enclosed with this letter." : "[Evidence will be provided upon request or with court proceedings]"}

┌─────────────────────────────────────────────────────────────────────────────┐
│  8. WHAT I REQUIRE FROM YOU                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║  RESPONSE DEADLINE: ${deadline.padEnd(53)}║
║  (14 days from the date of this letter)                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝

Within the above deadline, I require you to EITHER:

(a) Pay the sum of £${claimAmount} in full settlement of this claim; OR

(b) Provide me with a full written response setting out:
    • Whether you admit or deny the claim
    • If you admit: when payment will be made
    • If you deny: your reasons and any counterclaim
    • Any proposals for settlement

If you fail to respond by ${deadline}, or if your response is 
unsatisfactory, I WILL COMMENCE COURT PROCEEDINGS against you without further 
notice. This may result in:
  • Judgment being entered against you
  • Additional costs being awarded against you
  • Your credit rating being affected

┌─────────────────────────────────────────────────────────────────────────────┐
│  9. ALTERNATIVE DISPUTE RESOLUTION                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Before commencing proceedings, I am willing to consider alternative dispute 
resolution (ADR) methods. If you wish to explore mediation, negotiation, or 
another form of ADR, please contact me within 7 days.

┌─────────────────────────────────────────────────────────────────────────────┐
│  10. COSTS WARNING                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

If court proceedings become necessary, I will seek to recover from you:
  • Court issue fee
  • Hearing fee (if applicable)
  • Interest on the judgment debt
  • Fixed costs as per CPR 45
  • Any other costs the court may award

═══════════════════════════════════════════════════════════════════════════════
STATEMENT OF TRUTH
═══════════════════════════════════════════════════════════════════════════════

I believe that the facts stated in this letter are true. I understand that 
proceedings for contempt of court may be brought against anyone who makes, or 
causes to be made, a false statement in a document verified by a statement of 
truth without an honest belief in its truth.

Yours faithfully,



────────────────────────────────────
Signature

${claimantName}

Date: ${ctx.today}

───────────────────────────────────────────────────────────────────────────────
Ref: ${caseRef}
This letter was sent by: ☐ First class post  ☐ Email  ☐ Recorded delivery
───────────────────────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════════════════════════╗
║  CHECKLIST FOR SENDER                                                         ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  ☐ Made copy of this letter for your records                                  ║
║  ☐ Attached all evidence documents listed above                               ║
║  ☐ Sent by recorded delivery / obtained proof of posting                      ║
║  ☐ Noted deadline date in calendar: ${deadline.padEnd(36)}║
║  ☐ If no response by deadline, ready to file court claim                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;
  },

  // ==========================================================================
  // EVIDENCE BUNDLE INDEX
  // ==========================================================================
  
  "UK-EVIDENCE-BUNDLE-INDEX": (ctx) => `
Generate a comprehensive Evidence Bundle Index for court/tribunal proceedings.

This index must clearly list all evidence documents in a logical, numbered order suitable for court submission.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
EVIDENCE BUNDLE INDEX
═══════════════════════════════════════════════════════════════════════════════

Case: ${ctx.caseTitle}
Claimant/Appellant: ${extractClaimantName(ctx.strategy, ctx.user) || "[Your Name]"}
Defendant/Respondent: ${extractDefendantName(ctx.strategy) || "[Respondent Name]"}
Date Prepared: ${ctx.today}
Bundle Reference: [Court/Tribunal Reference Number]

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS FOR USE
═══════════════════════════════════════════════════════════════════════════════

This evidence bundle contains ${ctx.evidence.length || "[number]"} items of evidence arranged in chronological order where applicable.

Each document is numbered sequentially and paginated. References in statements and submissions should use the format "Bundle page X" or "Document X, page Y".

═══════════════════════════════════════════════════════════════════════════════
SECTION A: CORRESPONDENCE
═══════════════════════════════════════════════════════════════════════════════

${generateEvidenceSection(ctx.evidence, "correspondence", "email", "letter")}

═══════════════════════════════════════════════════════════════════════════════
SECTION B: CONTRACTUAL DOCUMENTS
═══════════════════════════════════════════════════════════════════════════════

${generateEvidenceSection(ctx.evidence, "contract", "agreement", "terms")}

═══════════════════════════════════════════════════════════════════════════════
SECTION C: FINANCIAL DOCUMENTS
═══════════════════════════════════════════════════════════════════════════════

${generateEvidenceSection(ctx.evidence, "invoice", "payment", "receipt", "statement", "bank")}

═══════════════════════════════════════════════════════════════════════════════
SECTION D: PHOTOGRAPHIC EVIDENCE
═══════════════════════════════════════════════════════════════════════════════

${generateEvidenceSection(ctx.evidence, "photo", "image", "picture", "screenshot")}

═══════════════════════════════════════════════════════════════════════════════
SECTION E: WITNESS STATEMENTS
═══════════════════════════════════════════════════════════════════════════════

${generateEvidenceSection(ctx.evidence, "statement", "witness", "testimony")}

═══════════════════════════════════════════════════════════════════════════════
SECTION F: MEDICAL/EXPERT REPORTS
═══════════════════════════════════════════════════════════════════════════════

${generateEvidenceSection(ctx.evidence, "medical", "expert", "report", "assessment")}

═══════════════════════════════════════════════════════════════════════════════
SECTION G: OTHER DOCUMENTS
═══════════════════════════════════════════════════════════════════════════════

${generateEvidenceSection(ctx.evidence, "other")}

═══════════════════════════════════════════════════════════════════════════════
BUNDLE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Total number of documents: ${ctx.evidence.length || "[number]"}
Total number of pages: [User to complete after pagination]

═══════════════════════════════════════════════════════════════════════════════
CERTIFICATE OF COMPLIANCE
═══════════════════════════════════════════════════════════════════════════════

I certify that:

1. This bundle contains all documents that I intend to rely upon in these proceedings
2. Each document is a true copy of the original (or marked as a copy where applicable)
3. The documents are arranged in a logical order
4. The bundle has been paginated consecutively
5. I have served a copy of this bundle index on the other party/parties

Signed: _______________________________

Name: ${extractClaimantName(ctx.strategy, ctx.user) || "[Your Name]"}

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
END OF EVIDENCE BUNDLE INDEX
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // SCHEDULE OF DAMAGES/LOSS
  // ==========================================================================
  
  "UK-SCHEDULE-OF-DAMAGES": (ctx) => `
Generate a detailed Schedule of Damages/Loss for court/tribunal proceedings.

This schedule must itemise all losses claimed with clear calculations and supporting evidence references.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
SCHEDULE OF DAMAGES / SCHEDULE OF LOSS
═══════════════════════════════════════════════════════════════════════════════

Case: ${ctx.caseTitle}
Claimant/Appellant: ${extractClaimantName(ctx.strategy, ctx.user) || "[Your Name]"}
Defendant/Respondent: ${extractDefendantName(ctx.strategy) || "[Respondent Name]"}
Date Prepared: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
INTRODUCTION
═══════════════════════════════════════════════════════════════════════════════

This Schedule sets out in detail all losses and damages claimed by the Claimant/Appellant as a result of the matters set out in the Particulars of Claim/Statement of Case.

All figures are calculated as at ${ctx.today} and are subject to updating until the date of judgment/hearing.

═══════════════════════════════════════════════════════════════════════════════
PART 1: PAST LOSSES (TO DATE)
═══════════════════════════════════════════════════════════════════════════════

1.1 LOSS OF EARNINGS / UNPAID WAGES

${generateLossOfEarningsSchedule(ctx.strategy, ctx.facts)}

1.2 LOSS OF BENEFITS

${generateLossOfBenefitsSchedule(ctx.strategy)}

1.3 EXPENSES INCURRED

${generateExpensesSchedule(ctx.strategy, ctx.evidence)}

1.4 OTHER PAST LOSSES

${generateOtherPastLosses(ctx.strategy)}

SUBTOTAL - PAST LOSSES: £${extractMonetaryAmount(ctx.strategy) || "_______"}

═══════════════════════════════════════════════════════════════════════════════
PART 2: FUTURE LOSSES (FROM DATE OF HEARING)
═══════════════════════════════════════════════════════════════════════════════

2.1 FUTURE LOSS OF EARNINGS

${generateFutureLossOfEarnings(ctx.strategy)}

2.2 FUTURE LOSS OF PENSION RIGHTS

${generateFuturePensionLoss(ctx.strategy)}

2.3 FUTURE MEDICAL/REHABILITATION COSTS

${generateFutureMedicalCosts(ctx.strategy)}

2.4 OTHER FUTURE LOSSES

${generateOtherFutureLosses(ctx.strategy)}

SUBTOTAL - FUTURE LOSSES: £_______

═══════════════════════════════════════════════════════════════════════════════
PART 3: GENERAL DAMAGES
═══════════════════════════════════════════════════════════════════════════════

3.1 PAIN, SUFFERING AND LOSS OF AMENITY

${generateGeneralDamagesSchedule(ctx.strategy)}

3.2 INJURY TO FEELINGS (Discrimination cases)

${generateInjuryToFeelingsSchedule(ctx.strategy)}

SUBTOTAL - GENERAL DAMAGES: £_______

═══════════════════════════════════════════════════════════════════════════════
PART 4: INTEREST
═══════════════════════════════════════════════════════════════════════════════

4.1 INTEREST ON PAST LOSSES

Calculation: £${extractMonetaryAmount(ctx.strategy) || "_______"} × 8% × [number of days]/365

Amount: £_______

4.2 INTEREST ON GENERAL DAMAGES

Calculation: £_______ × 2% × [number of days]/365

Amount: £_______

SUBTOTAL - INTEREST: £_______

═══════════════════════════════════════════════════════════════════════════════
PART 5: SUMMARY OF CLAIMS
═══════════════════════════════════════════════════════════════════════════════

Past Losses:                                    £${extractMonetaryAmount(ctx.strategy) || "0.00"}
Future Losses:                                  £0.00 (not claimed)
General Damages:                                £0.00 (not claimed)
Interest (to date):                             £0.00 (accruing)
─────────────────────────────────────────────────────────
TOTAL DAMAGES CLAIMED:                          £${extractMonetaryAmount(ctx.strategy) || "0.00"}

Interest will continue to accrue at the rate of 8% per annum on past losses and 2% per annum on general damages until the date of judgment.

═══════════════════════════════════════════════════════════════════════════════
PART 6: EVIDENCE IN SUPPORT
═══════════════════════════════════════════════════════════════════════════════

The following evidence supports the figures claimed above:

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n") : "[List supporting documents - payslips, bank statements, invoices, medical reports, etc.]"}

═══════════════════════════════════════════════════════════════════════════════
STATEMENT OF TRUTH
═══════════════════════════════════════════════════════════════════════════════

I believe that the facts stated in this Schedule of Damages are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

Signed: _______________________________

Name: ${extractClaimantName(ctx.strategy, ctx.user) || "[Your Name]"}

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
END OF SCHEDULE OF DAMAGES
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // CPR32 WITNESS STATEMENT
  // ==========================================================================
  
  "UK-CPR32-WITNESS-STATEMENT": (ctx) => `
Generate a formal Witness Statement complying with Civil Procedure Rules Part 32.

Use the ACTUAL CASE DATA provided below - do NOT use placeholders like [Your Name].

═══════════════════════════════════════════════════════════════════════════════
WITNESS STATEMENT
═══════════════════════════════════════════════════════════════════════════════

In the ${ctx.routingDecision?.forum?.includes('tribunal') ? 'Tribunal' : 'County Court'}

Case: ${ctx.caseTitle}

BETWEEN:

${extractClaimantName(ctx.strategy, ctx.user)}
                                                                    Claimant
-and-

${extractDefendantName(ctx.strategy)}
                                                                    Defendant

═══════════════════════════════════════════════════════════════════════════════
WITNESS STATEMENT OF ${(extractClaimantName(ctx.strategy, ctx.user) || "").toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════

I, ${extractClaimantName(ctx.strategy, ctx.user)}, will say as follows:

1. INTRODUCTION

1.1 I am the Claimant in these proceedings and make this statement from my own knowledge and belief, except where I indicate otherwise.

1.2 I make this statement in support of my claim against ${extractDefendantName(ctx.strategy)}.

2. BACKGROUND AND FACTS

${generateWitnessFactsSection(ctx.strategy, ctx.evidence)}

3. EVIDENCE IN SUPPORT

${ctx.evidence.length > 0 
  ? ctx.evidence.map((e, i) => `3.${i + 1} I refer to Exhibit E${i + 1} (${e.title || e.fileName}), which shows ${e.description || 'supporting evidence for my claim'}.`).join('\n\n')
  : '3.1 I will provide documentary evidence in support of my claim.'}

4. CONCLUSION

4.1 For the reasons set out above, I respectfully ask the court to find in my favour and award me the sum of ${extractMonetaryAmount(ctx.strategy) ? `£${extractMonetaryAmount(ctx.strategy)}` : 'the amount claimed'} plus interest and costs.

═══════════════════════════════════════════════════════════════════════════════
STATEMENT OF TRUTH
═══════════════════════════════════════════════════════════════════════════════

I believe that the facts stated in this witness statement are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

Signed: _________________________

Full Name: ${extractClaimantName(ctx.strategy, ctx.user)}

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
END OF WITNESS STATEMENT
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // SOCIAL SECURITY APPEAL (SSCS1)
  // ==========================================================================
  
  "UK-SSCS1-SOCIAL-SECURITY-APPEAL": (ctx) => `
Generate an official UK Social Security and Child Support Tribunal Appeal Form (SSCS1).

This form is used to appeal decisions made by the Department for Work and Pensions (DWP), HM Revenue and Customs (HMRC), or local authorities regarding benefits.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
SOCIAL SECURITY AND CHILD SUPPORT APPEAL FORM (SSCS1)
═══════════════════════════════════════════════════════════════════════════════

Appeal a benefit decision
Case: ${ctx.caseTitle}
Date prepared: ${ctx.today}

IMPORTANT: You must appeal within one month of the date on your decision letter (or 13 months if you have a good reason for the delay).

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: YOUR DETAILS
═══════════════════════════════════════════════════════════════════════════════

1.1 Title: ☐ Mr ☐ Mrs ☐ Miss ☐ Ms ☐ Other: _______

1.2 First name(s): _______________________________

1.3 Surname: ____________________________________

1.4 Date of birth: ____/____/________ (DD/MM/YYYY)

1.5 National Insurance number: _______________________________

1.6 Address:
    House/Flat number: _______________________________
    Street: __________________________________________
    Town/City: _______________________________________
    County: __________________________________________
    Postcode: ________________________________________

1.7 Phone number: ____________________________________

1.8 Email address: ___________________________________

1.9 Preferred contact method: ☐ Email ☐ Post ☐ Phone

1.10 Do you need help with this form?
     ☐ Yes (please specify): _______________________________
     ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: BENEFIT DECISION DETAILS
═══════════════════════════════════════════════════════════════════════════════

2.1 Which benefit decision are you appealing?

${determineBenefitType(ctx.strategy, ctx.facts)}

2.2 Decision date: ____/____/________ (DD/MM/YYYY)

2.3 Decision maker reference number: _______________________________

2.4 What decision are you appealing?

${generateBenefitDecisionDescription(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: YOUR APPEAL GROUNDS
═══════════════════════════════════════════════════════════════════════════════

3.1 Why do you think the decision is wrong?

IMPORTANT: Explain clearly why you disagree with the decision. Be specific and refer to the law, regulations, or evidence.

${generateBenefitAppealGrounds(ctx.strategy, ctx.facts, ctx.evidence)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: MEDICAL EVIDENCE (If applicable)
═══════════════════════════════════════════════════════════════════════════════

4.1 Do you have any medical evidence to support your appeal?
    ☐ Yes (continue to 4.2)
    ☐ No

4.2 Please list medical evidence you are submitting:

${generateMedicalEvidenceList(ctx.evidence)}

4.3 Do you want the tribunal to arrange a medical examination?
    ☐ Yes  ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: OTHER EVIDENCE
═══════════════════════════════════════════════════════════════════════════════

5.1 What other evidence are you submitting?

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n") : "[List any other evidence - letters, documents, photos, etc.]"}

5.2 Are you submitting any witness statements?
    ☐ Yes (how many? _______)  ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: HEARING PREFERENCES
═══════════════════════════════════════════════════════════════════════════════

6.1 Do you want to attend a hearing?
    ☐ Yes (continue to 6.2)
    ☐ No - decide on the papers only

6.2 Do you need any special arrangements for the hearing?
    ☐ Yes (please specify): _______________________________
    ☐ No

6.3 Do you need an interpreter?
    ☐ Yes (which language? _______)  ☐ No

6.4 Do you need a sign language interpreter?
    ☐ Yes  ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 7: REPRESENTATIVE (If applicable)
═══════════════════════════════════════════════════════════════════════════════

7.1 Do you have a representative?
    ☐ Yes (continue to 7.2)
    ☐ No

7.2 Representative details:
    Name: _______________________________
    Organisation: _______________________________
    Address: _______________________________
    Phone: _______________________________
    Email: _______________________________

═══════════════════════════════════════════════════════════════════════════════
DECLARATION AND SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

I confirm that the information I have given on this form is correct and complete to the best of my knowledge and belief.

I understand that:
• I must submit this appeal within one month of the decision date (or 13 months with good reason)
• I should provide all relevant evidence with this form
• Proceedings for contempt of court may be brought against anyone who makes a false statement without an honest belief in its truth

Signature: _______________________________

Print name: ______________________________

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
SUBMISSION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Submit this form:
• Online (preferred): www.gov.uk/appeal-benefit-decision
• By post: HM Courts & Tribunals Service, Social Security and Child Support Tribunal, PO Box 14620, Birmingham, B16 6FR

Attach: Decision letter, all evidence, medical reports (if applicable)

═══════════════════════════════════════════════════════════════════════════════
END OF FORM SSCS1
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // POPLA PARKING APPEAL
  // ==========================================================================
  
  "UK-POPLA-PARKING-APPEAL": (ctx) => `
Generate a POPLA (Parking on Private Land Appeals) appeal form.

POPLA is the independent appeals service for parking charge notices issued on private land in England and Wales.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
POPLA APPEAL FORM
═══════════════════════════════════════════════════════════════════════════════

Parking on Private Land Appeals
Case: ${ctx.caseTitle}
Date prepared: ${ctx.today}

IMPORTANT: You must submit your appeal within 28 days of receiving the parking operator's rejection of your initial appeal.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: YOUR DETAILS
═══════════════════════════════════════════════════════════════════════════════

1.1 Title: ☐ Mr ☐ Mrs ☐ Miss ☐ Ms ☐ Other: _______

1.2 First name(s): _______________________________

1.3 Surname: ____________________________________

1.4 Address:
    House/Flat number: _______________________________
    Street: __________________________________________
    Town/City: _______________________________________
    County: __________________________________________
    Postcode: ________________________________________

1.5 Phone number: ____________________________________

1.6 Email address: ___________________________________

1.7 Vehicle registration number: _______________________________

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: PARKING CHARGE NOTICE DETAILS
═══════════════════════════════════════════════════════════════════════════════

2.1 Parking Charge Notice (PCN) reference number: _______________________________

2.2 Date PCN was issued: ____/____/________ (DD/MM/YYYY)

2.3 Time PCN was issued: _______:_______ (HH:MM)

2.4 Location where PCN was issued: _______________________________

2.5 Parking operator name: ${extractDefendantName(ctx.strategy) || "[Parking Company Name]"}

2.6 Amount of charge: £_______

2.7 Date you received the PCN: ____/____/________ (DD/MM/YYYY)

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: APPEAL GROUNDS
═══════════════════════════════════════════════════════════════════════════════

3.1 Select the ground(s) for your appeal (tick all that apply):

${determinePOPLAGrounds(ctx.strategy, ctx.facts)}

3.2 Please explain in detail why you believe the parking charge should be cancelled:

${generatePOPLAAppealExplanation(ctx.strategy, ctx.facts, ctx.evidence)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: EVIDENCE
═══════════════════════════════════════════════════════════════════════════════

4.1 What evidence are you submitting with this appeal?

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n") : "[List evidence - photos, receipts, permits, witness statements, etc.]"}

4.2 Evidence checklist:

☐ Photographs of the parking location
☐ Photographs of signage (or lack thereof)
☐ Receipt or proof of payment
☐ Permit or authorisation document
☐ Witness statement(s)
☐ Correspondence with parking operator
☐ Other: _______________________________

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: MITIGATING CIRCUMSTANCES (Optional)
═══════════════════════════════════════════════════════════════════════════════

5.1 Are there any mitigating circumstances you wish to bring to POPLA's attention?

${generatePOPLAMitigatingCircumstances(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: PREVIOUS CORRESPONDENCE
═══════════════════════════════════════════════════════════════════════════════

6.1 Have you appealed directly to the parking operator?
    ☐ Yes (continue to 6.2)
    ☐ No

6.2 What was their response?

${generatePOPLAOperatorResponse(ctx.strategy)}

6.3 Date of operator's rejection: ____/____/________ (DD/MM/YYYY)

═══════════════════════════════════════════════════════════════════════════════
DECLARATION AND SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

I confirm that:
• The information I have given on this form is correct and complete to the best of my knowledge and belief
• I am the registered keeper of the vehicle (or have authority to appeal on behalf of the keeper)
• I understand that POPLA's decision is final and binding on both parties

Signature: _______________________________

Print name: ______________________________

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
SUBMISSION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Submit this appeal:
• Online (preferred): www.popla.co.uk
• By post: POPLA, PO Box 1270, Warrington, WA4 9RL

Attach: PCN, operator's rejection letter, all evidence, photos

IMPORTANT: You must submit within 28 days of the operator's rejection.

═══════════════════════════════════════════════════════════════════════════════
END OF POPLA APPEAL FORM
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // MAGISTRATES COURT MITIGATION STATEMENT
  // ==========================================================================
  
  "UK-MAG-MITIGATION-STATEMENT": (ctx) => `
Generate a Mitigation Statement for Magistrates' Court proceedings.

This statement is presented to the court before sentencing to explain personal circumstances and request leniency.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
MITIGATION STATEMENT
═══════════════════════════════════════════════════════════════════════════════

IN THE MAGISTRATES' COURT

Case Number: [To be allocated by court]
Defendant: [Your Name]
Prosecution: ${extractDefendantName(ctx.strategy) || "[Prosecuting Authority]"}
Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
1. INTRODUCTION
═══════════════════════════════════════════════════════════════════════════════

I, [Your Full Name], respectfully submit this mitigation statement to assist the court in determining an appropriate sentence.

I [plead guilty / have been found guilty] of [offence(s)] and accept full responsibility for my actions.

═══════════════════════════════════════════════════════════════════════════════
2. PERSONAL DETAILS
═══════════════════════════════════════════════════════════════════════════════

2.1 Full name: [Your Full Name]

2.2 Date of birth: ____/____/________ (DD/MM/YYYY)

2.3 Address:
    ${extractEmployerAddress(ctx.strategy) || `[Your Address]
    [Postcode]`}

2.4 Occupation: ${extractJobTitle(ctx.strategy) || "[Your Occupation]"}

2.5 Employment status: ☐ Employed ☐ Self-employed ☐ Unemployed ☐ Retired ☐ Student

2.6 Monthly income: £_______

2.7 Dependents: ☐ None ☐ Children: _______ ☐ Other: _______

═══════════════════════════════════════════════════════════════════════════════
3. ACKNOWLEDGMENT OF OFFENCE
═══════════════════════════════════════════════════════════════════════════════

I fully accept that I committed the offence(s) and I am deeply sorry for my actions. I understand the seriousness of what I did and the impact it may have had.

${generateMitigationAcknowledgment(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
4. EXPLANATION OF CIRCUMSTANCES
═══════════════════════════════════════════════════════════════════════════════

While I do not seek to excuse my actions, I would like to explain the circumstances that led to the offence:

${generateMitigationCircumstances(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
5. REMORSE AND INSIGHT
═══════════════════════════════════════════════════════════════════════════════

I am genuinely remorseful for my actions and have reflected deeply on what I did wrong. I understand:

${generateMitigationRemorse(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
6. PERSONAL CIRCUMSTANCES
═══════════════════════════════════════════════════════════════════════════════

6.1 Financial circumstances:

${generateMitigationFinancialCircumstances(ctx.strategy)}

6.2 Health circumstances:

${generateMitigationHealthCircumstances(ctx.strategy)}

6.3 Family circumstances:

${generateMitigationFamilyCircumstances(ctx.strategy)}

6.4 Employment circumstances:

${generateMitigationEmploymentCircumstances(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
7. CHARACTER AND PREVIOUS CONVICTIONS
═══════════════════════════════════════════════════════════════════════════════

7.1 Previous convictions: ☐ None ☐ Yes (please provide details): _______________________________

7.2 Character references:

${generateMitigationCharacterReferences(ctx.evidence)}

7.3 Community involvement:

${generateMitigationCommunityInvolvement(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
8. STEPS TAKEN TO ADDRESS THE ISSUE
═══════════════════════════════════════════════════════════════════════════════

Since the offence, I have taken the following steps to ensure this will not happen again:

${generateMitigationStepsTaken(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
9. IMPACT OF POSSIBLE SENTENCE
═══════════════════════════════════════════════════════════════════════════════

I respectfully ask the court to consider the following when determining sentence:

${generateMitigationImpactOfSentence(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
10. CONCLUSION
═══════════════════════════════════════════════════════════════════════════════

I respectfully request that the court shows leniency in sentencing, taking into account:

• My genuine remorse and acceptance of responsibility
• My personal circumstances
• The steps I have taken to address the issue
• My previous good character (if applicable)
• The impact that a harsh sentence would have on me and my dependents

I am committed to ensuring I do not reoffend and I ask for the opportunity to demonstrate this.

═══════════════════════════════════════════════════════════════════════════════
SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

Signed: _______________________________

Print name: [Your Name]

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
END OF MITIGATION STATEMENT
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // IMMIGRATION APPEAL (IAFT5)
  // ==========================================================================
  
  "UK-IAFT5-IMMIGRATION-APPEAL": (ctx) => `
Generate an official UK Immigration Appeal Form (IAFT5).

This form is used to appeal immigration decisions made by the Home Office, including visa refusals, leave to remain decisions, and deportation orders.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
IMMIGRATION APPEAL FORM (IAFT5)
═══════════════════════════════════════════════════════════════════════════════

Appeal an immigration decision
Case: ${ctx.caseTitle}
Date prepared: ${ctx.today}

IMPORTANT: You must appeal within 14 days if you are in the UK, or 28 days if you are outside the UK, from the date you received the decision.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: APPELLANT DETAILS
═══════════════════════════════════════════════════════════════════════════════

1.1 Title: ☐ Mr ☐ Mrs ☐ Miss ☐ Ms ☐ Other: _______

1.2 First name(s): _______________________________

1.3 Surname: ____________________________________

1.4 Date of birth: ____/____/________ (DD/MM/YYYY)

1.5 Nationality: _______________________________

1.6 Passport number: _______________________________

1.7 Home Office reference number: _______________________________

1.8 Current address:
    ${extractEmployerAddress(ctx.strategy) || `[Your Address]
    [Address Line 2]
    [City]
    [Postcode]
    Country: [Country]`}

1.9 Phone number: ____________________________________

1.10 Email address: ___________________________________

1.11 Are you currently in the UK?
     ☐ Yes  ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: REPRESENTATIVE (If applicable)
═══════════════════════════════════════════════════════════════════════════════

2.1 Do you have a legal representative?
    ☐ Yes (continue to 2.2)
    ☐ No

2.2 Representative details:
    Name: _______________________________
    Firm: _______________________________
    Address: _______________________________
    Phone: _______________________________
    Email: _______________________________
    OISC registration number: _______________________________

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: DECISION BEING APPEALED
═══════════════════════════════════════════════════════════════════════════════

3.1 What type of decision are you appealing?

${determineImmigrationDecisionType(ctx.strategy, ctx.facts)}

3.2 Date of decision: ____/____/________ (DD/MM/YYYY)

3.3 Date you received the decision: ____/____/________ (DD/MM/YYYY)

3.4 Home Office reference number: _______________________________

3.5 What was the decision?

${generateImmigrationDecisionDescription(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: GROUNDS OF APPEAL
═══════════════════════════════════════════════════════════════════════════════

4.1 On what grounds are you appealing? (tick all that apply)

${determineImmigrationAppealGrounds(ctx.strategy, ctx.facts)}

4.2 Please explain in detail why you believe the decision is wrong:

${generateImmigrationAppealExplanation(ctx.strategy, ctx.facts, ctx.evidence)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: HUMAN RIGHTS CLAIM
═══════════════════════════════════════════════════════════════════════════════

5.1 Are you making a human rights claim under Article 8 ECHR (right to family/private life)?
    ☐ Yes (continue to 5.2)
    ☐ No

5.2 Please explain your human rights claim:

${generateHumanRightsClaim(ctx.strategy, ctx.facts)}

5.3 Family members affected:

${generateFamilyMembersAffected(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: EVIDENCE
═══════════════════════════════════════════════════════════════════════════════

6.1 What evidence are you submitting with this appeal?

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n") : "[List evidence - documents, letters, certificates, etc.]"}

6.2 Evidence checklist:

☐ Passport and travel documents
☐ Birth certificates
☐ Marriage/civil partnership certificate
☐ Evidence of relationship (if family visa)
☐ Employment documents
☐ Financial documents (bank statements, payslips)
☐ Accommodation evidence
☐ English language test certificate
☐ Educational qualifications
☐ Medical evidence (if applicable)
☐ Other supporting documents

6.3 Are you submitting any witness statements?
    ☐ Yes (how many? _______)  ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 7: HEARING PREFERENCES
═══════════════════════════════════════════════════════════════════════════════

7.1 Do you want to attend a hearing?
    ☐ Yes (continue to 7.2)
    ☐ No - decide on the papers only

7.2 Do you need any special arrangements for the hearing?
    ☐ Yes (please specify): _______________________________
    ☐ No

7.3 Do you need an interpreter?
    ☐ Yes (which language? _______)  ☐ No

7.4 Do you need a sign language interpreter?
    ☐ Yes  ☐ No

═══════════════════════════════════════════════════════════════════════════════
DECLARATION AND SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

I confirm that:
• The information I have given on this form is correct and complete to the best of my knowledge and belief
• I understand that I must appeal within the time limit (14 days if in UK, 28 days if outside UK)
• I understand that proceedings for contempt of court may be brought against anyone who makes a false statement without an honest belief in its truth
• I understand that providing false information may result in my appeal being dismissed and may affect future applications

Signature: _______________________________

Print name: ______________________________

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
SUBMISSION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Submit this appeal:
• Online (preferred): www.gov.uk/immigration-appeals
• By post: First-tier Tribunal (Immigration and Asylum), PO Box 6987, Leicester, LE1 6ZX

Attach: Decision letter, all evidence, supporting documents

IMPORTANT: Submit within 14 days (if in UK) or 28 days (if outside UK) of receiving the decision.

═══════════════════════════════════════════════════════════════════════════════
END OF FORM IAFT5
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // EMPLOYMENT GRIEVANCE LETTER
  // ==========================================================================
  
  "UK-GRIEVANCE-LETTER-EMPLOYMENT": (ctx) => `
Generate a formal Employment Grievance Letter in accordance with the ACAS Code of Practice.

This letter initiates the formal grievance procedure and must be submitted to your employer before taking further action.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
FORMAL GRIEVANCE LETTER
═══════════════════════════════════════════════════════════════════════════════

Date: ${ctx.today}

To: ${extractEmployerName(ctx.strategy) || "[Employer Name]"}
    ${extractEmployerAddress(ctx.strategy) || `[Employer Address]
    [Postcode]`}

From: [Your Name]
     [Your Address]
     [Postcode]

Re: Formal Grievance - ${ctx.caseTitle}

Dear [Manager/HR Manager Name],

═══════════════════════════════════════════════════════════════════════════════
1. INTRODUCTION
═══════════════════════════════════════════════════════════════════════════════

I am writing to raise a formal grievance in accordance with the ACAS Code of Practice on Disciplinary and Grievance Procedures and my employer's grievance procedure.

I am raising this grievance because: ${generateGrievanceReason(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
2. BACKGROUND
═══════════════════════════════════════════════════════════════════════════════

2.1 My employment details:

    Job title: ${extractJobTitle(ctx.strategy) || "[Your Job Title]"}
    Start date: ${extractStartDate(ctx.strategy) || "[Start Date]"}
    Department: [Your Department]
    Manager: [Your Manager's Name]

2.2 Employment status: ☐ Permanent ☐ Fixed-term ☐ Temporary ☐ Agency

═══════════════════════════════════════════════════════════════════════════════
3. DETAILS OF THE GRIEVANCE
═══════════════════════════════════════════════════════════════════════════════

3.1 Nature of the grievance:

${determineGrievanceType(ctx.strategy, ctx.facts)}

3.2 Chronology of events:

${generateGrievanceChronology(ctx.facts)}

3.3 Specific incidents:

${generateGrievanceIncidents(ctx.strategy, ctx.facts)}

3.4 Impact on me:

${generateGrievanceImpact(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
4. PREVIOUS ATTEMPTS TO RESOLVE
═══════════════════════════════════════════════════════════════════════════════

4.1 Have you raised this matter informally before?
    ☐ Yes (continue to 4.2)
    ☐ No

4.2 Details of previous attempts:

${generatePreviousResolutionAttempts(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
5. EVIDENCE
═══════════════════════════════════════════════════════════════════════════════

5.1 Evidence in support of this grievance:

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n") : "[List evidence - emails, letters, witness statements, diary entries, etc.]"}

5.2 Witnesses:

${generateGrievanceWitnesses(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
6. DESIRED OUTCOME
═══════════════════════════════════════════════════════════════════════════════

I would like the following action to be taken to resolve this grievance:

${ctx.strategy.desiredOutcome || generateGrievanceDesiredOutcome(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
7. REQUEST FOR GRIEVANCE MEETING
═══════════════════════════════════════════════════════════════════════════════

I request that a formal grievance meeting be arranged in accordance with the ACAS Code of Practice and my employer's grievance procedure.

I would like to be accompanied at the meeting by:
☐ A work colleague
☐ A trade union representative
☐ Other (specify): _______________________________

I am available for a meeting on the following dates/times:
• [Date 1]: [Time]
• [Date 2]: [Time]
• [Date 3]: [Time]

Please confirm the date, time, and location of the meeting at least 5 working days in advance.

═══════════════════════════════════════════════════════════════════════════════
8. CONFIDENTIALITY
═══════════════════════════════════════════════════════════════════════════════

I understand that this grievance will be handled confidentially and in accordance with data protection legislation. I expect that only those who need to know will be informed of this matter.

═══════════════════════════════════════════════════════════════════════════════
9. NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════

I look forward to receiving confirmation of receipt of this grievance and details of the grievance meeting within 5 working days, as required by the ACAS Code of Practice.

If this matter is not resolved satisfactorily through the grievance procedure, I reserve the right to take further action, including but not limited to making a claim to an employment tribunal.

═══════════════════════════════════════════════════════════════════════════════
SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

Yours sincerely,

[Your Signature]

[Your Printed Name]

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
IMPORTANT NOTES
═══════════════════════════════════════════════════════════════════════════════

• Keep a copy of this letter and proof of posting/delivery
• You have the right to be accompanied at the grievance meeting
• Your employer should respond within 5 working days
• If the matter is not resolved, you may be able to appeal internally
• You may be able to make a claim to an employment tribunal if the grievance is not resolved satisfactorily

═══════════════════════════════════════════════════════════════════════════════
END OF GRIEVANCE LETTER
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // GENERAL COMPLAINT LETTER
  // ==========================================================================
  
  "UK-COMPLAINT-LETTER-GENERAL": (ctx) => `
Generate a formal General Complaint Letter suitable for various disputes.

This template can be adapted for complaints to companies, organisations, service providers, or public bodies.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
FORMAL COMPLAINT LETTER
═══════════════════════════════════════════════════════════════════════════════

Date: ${ctx.today}

To: ${extractDefendantName(ctx.strategy) || "[Company/Organisation Name]"}
    ${extractEmployerAddress(ctx.strategy) || `[Company Address]
    [Postcode]`}

From: [Your Name]
     [Your Address]
     [Postcode]
     Email: [Your Email]
     Phone: [Your Phone]

Re: Formal Complaint - ${ctx.caseTitle}
    Reference Number: [Your Reference/Account Number if applicable]

Dear Sir/Madam,

═══════════════════════════════════════════════════════════════════════════════
1. INTRODUCTION
═══════════════════════════════════════════════════════════════════════════════

I am writing to make a formal complaint regarding ${generateComplaintSubject(ctx.strategy, ctx.facts)}.

This matter has caused me significant inconvenience/distress/financial loss and I expect it to be resolved promptly and satisfactorily.

═══════════════════════════════════════════════════════════════════════════════
2. BACKGROUND INFORMATION
═══════════════════════════════════════════════════════════════════════════════

2.1 My details:

    Name: [Your Full Name]
    Account/Reference number: [If applicable]
    Date of incident/matter: ${extractStartDate(ctx.strategy) || "[Date]"}

2.2 Relevant transaction/service details:

${generateComplaintTransactionDetails(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
3. DETAILS OF THE COMPLAINT
═══════════════════════════════════════════════════════════════════════════════

3.1 What went wrong:

${generateComplaintDetails(ctx.strategy, ctx.facts)}

3.2 Chronology of events:

${generateComplaintChronology(ctx.facts)}

3.3 How this has affected me:

${generateComplaintImpact(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
4. PREVIOUS CONTACT
═══════════════════════════════════════════════════════════════════════════════

4.1 Have you contacted them about this before?
    ☐ Yes (continue to 4.2)
    ☐ No

4.2 Details of previous contact:

${generateComplaintPreviousContact(ctx.strategy, ctx.facts)}

4.3 Their response (if any):

${generateComplaintPreviousResponse(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
5. EVIDENCE
═══════════════════════════════════════════════════════════════════════════════

5.1 Evidence in support of this complaint:

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n") : "[List evidence - receipts, invoices, correspondence, photos, screenshots, etc.]"}

${ctx.evidence.length > 0 ? "\nCopies of the above evidence are attached to this letter." : "[Evidence available upon request]"}

═══════════════════════════════════════════════════════════════════════════════
6. WHAT I WANT YOU TO DO
═══════════════════════════════════════════════════════════════════════════════

To resolve this complaint, I require you to:

${ctx.strategy.desiredOutcome || generateComplaintDesiredOutcome(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
7. TIMESCALE FOR RESPONSE
═══════════════════════════════════════════════════════════════════════════════

I expect to receive a full written response to this complaint within 14 days of the date of this letter.

If I do not receive a satisfactory response within this time, I will:
• Escalate this complaint to your senior management/head office
• Contact the relevant ombudsman/regulator (${determineRelevantOmbudsman(ctx.strategy)})
• Consider taking legal action
• Report this matter to relevant consumer protection organisations

═══════════════════════════════════════════════════════════════════════════════
8. LEGAL RIGHTS
═══════════════════════════════════════════════════════════════════════════════

I am aware of my legal rights under:
• Consumer Rights Act 2015
• Consumer Contracts Regulations 2013
• Data Protection Act 2018
• Other relevant legislation: _______________________________

I reserve the right to take further action if this matter is not resolved satisfactorily.

═══════════════════════════════════════════════════════════════════════════════
SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

I look forward to your prompt response.

Yours faithfully,

[Your Signature]

[Your Printed Name]

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
IMPORTANT NOTES
═══════════════════════════════════════════════════════════════════════════════

• Keep a copy of this letter and proof of posting/delivery
• Send by recorded delivery or email with read receipt if possible
• If no response within 14 days, consider escalating to ombudsman/regulator
• Consider seeking legal advice if the matter involves significant sums or complex issues

═══════════════════════════════════════════════════════════════════════════════
END OF COMPLAINT LETTER
═══════════════════════════════════════════════════════════════════════════════
`,

  // ==========================================================================
  // FINANCIAL OMBUDSMAN COMPLAINT FORM
  // ==========================================================================
  
  "UK-FOS-COMPLAINT-FORM": (ctx) => `
Generate a Financial Ombudsman Service (FOS) complaint form.

The FOS handles complaints about financial services providers including banks, insurance companies, investment firms, and payment service providers.

FORMAT EXACTLY AS FOLLOWS:

═══════════════════════════════════════════════════════════════════════════════
FINANCIAL OMBUDSMAN SERVICE COMPLAINT FORM
═══════════════════════════════════════════════════════════════════════════════

Complain about a financial services provider
Case: ${ctx.caseTitle}
Date prepared: ${ctx.today}

IMPORTANT: You must first complain directly to the financial services provider and allow them 8 weeks to respond (or receive a final response) before the FOS can consider your complaint.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: YOUR DETAILS
═══════════════════════════════════════════════════════════════════════════════

1.1 Title: ☐ Mr ☐ Mrs ☐ Miss ☐ Ms ☐ Other: _______

1.2 First name(s): _______________________________

1.3 Surname: ____________________________________

1.4 Date of birth: ____/____/________ (DD/MM/YYYY)

1.5 Address:
    House/Flat number: _______________________________
    Street: __________________________________________
    Town/City: _______________________________________
    County: __________________________________________
    Postcode: ________________________________________

1.6 Phone number: ____________________________________

1.7 Email address: ___________________________________

1.8 Preferred contact method: ☐ Email ☐ Post ☐ Phone

1.9 Do you need help with this form?
    ☐ Yes (please specify): _______________________________
    ☐ No

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: REPRESENTATIVE (If applicable)
═══════════════════════════════════════════════════════════════════════════════

2.1 Do you have a representative helping you with this complaint?
    ☐ Yes (continue to 2.2)
    ☐ No

2.2 Representative details:
    Name: _______________________________
    Organisation: _______________________________
    Address: _______________________________
    Phone: _______________________________
    Email: _______________________________

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: FINANCIAL SERVICES PROVIDER DETAILS
═══════════════════════════════════════════════════════════════════════════════

3.1 Name of the financial services provider you are complaining about:

${extractDefendantName(ctx.strategy) || "[Bank/Insurance Company/Financial Firm Name]"}

3.2 Address:
    ${extractEmployerAddress(ctx.strategy) || `[Provider Address]
    [Postcode]`}

3.3 Your account/reference number: _______________________________

3.4 Type of financial service:

${determineFinancialServiceType(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: YOUR COMPLAINT
═══════════════════════════════════════════════════════════════════════════════

4.1 What is your complaint about?

${generateFOSComplaintDescription(ctx.strategy, ctx.facts)}

4.2 When did the problem occur?

    Date: ${extractStartDate(ctx.strategy) || "____/____/________ (DD/MM/YYYY)"}

4.3 Chronology of events:

${generateFOSChronology(ctx.facts)}

4.4 What went wrong?

${generateFOSWhatWentWrong(ctx.strategy, ctx.facts)}

4.5 How has this affected you?

${generateFOSImpact(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: PREVIOUS COMPLAINT TO PROVIDER
═══════════════════════════════════════════════════════════════════════════════

5.1 Have you complained directly to the financial services provider?
    ☐ Yes (continue to 5.2)
    ☐ No - you must complain to them first

5.2 When did you first complain to them?

    Date: ____/____/________ (DD/MM/YYYY)

5.3 What was their response?

${generateFOSProviderResponse(ctx.strategy)}

5.4 Date of their final response: ____/____/________ (DD/MM/YYYY)

5.5 Are you satisfied with their response?
    ☐ No - that's why I'm complaining to FOS
    ☐ They haven't responded yet (must be 8 weeks since complaint)

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: WHAT YOU WANT
═══════════════════════════════════════════════════════════════════════════════

6.1 What outcome are you seeking?

${ctx.strategy.desiredOutcome || generateFOSDesiredOutcome(ctx.strategy, ctx.facts)}

6.2 Amount claimed (if applicable):

    £${extractMonetaryAmount(ctx.strategy) || "_______"}

6.3 Breakdown of amount:

${generateFOSAmountBreakdown(ctx.strategy)}

═══════════════════════════════════════════════════════════════════════════════
SECTION 7: EVIDENCE
═══════════════════════════════════════════════════════════════════════════════

7.1 What evidence are you submitting with this complaint?

${ctx.evidence.length > 0 ? ctx.evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n") : "[List evidence - statements, correspondence, contracts, photos, etc.]"}

7.2 Evidence checklist:

☐ Account statements
☐ Correspondence with provider
☐ Contract/agreement documents
☐ Policy documents (if insurance)
☐ Photos/screenshots
☐ Witness statements
☐ Other supporting documents

═══════════════════════════════════════════════════════════════════════════════
SECTION 8: ADDITIONAL INFORMATION
═══════════════════════════════════════════════════════════════════════════════

8.1 Is there anything else you think the FOS should know?

${generateFOSAdditionalInfo(ctx.strategy, ctx.facts)}

═══════════════════════════════════════════════════════════════════════════════
DECLARATION AND SIGNATURE
═══════════════════════════════════════════════════════════════════════════════

I confirm that:
• The information I have given on this form is correct and complete to the best of my knowledge and belief
• I have complained directly to the financial services provider and either received a final response or 8 weeks have passed
• I understand that the FOS will share this complaint with the financial services provider
• I understand that proceedings for contempt of court may be brought against anyone who makes a false statement without an honest belief in its truth

Signature: _______________________________

Print name: ______________________________

Date: ${ctx.today}

═══════════════════════════════════════════════════════════════════════════════
SUBMISSION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Submit this complaint:
• Online (preferred): www.financial-ombudsman.org.uk
• By post: Financial Ombudsman Service, Exchange Tower, London, E14 9SR
• By phone: 0800 023 4567

Attach: Provider's final response letter, all evidence, account statements, correspondence

IMPORTANT: You must have complained to the provider first and either received a final response or waited 8 weeks.

═══════════════════════════════════════════════════════════════════════════════
END OF FOS COMPLAINT FORM
═══════════════════════════════════════════════════════════════════════════════
`,

  // ============================================================================
  // TIER 1 TEMPLATES (Simple Letters)
  // ============================================================================
  ...TIER_1_TEMPLATES,
  
  // ============================================================================
  // TIER 2 TEMPLATES (Complex/ADR)
  // ============================================================================
  ...TIER_2_TEMPLATES,

};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate witness facts section from case data
 */
function generateWitnessFactsSection(strategy: CaseStrategy, evidence: any[]): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  if (facts.length === 0) {
    return "2.1 [The AI will generate facts based on the case information provided above]";
  }
  
  // Convert facts to numbered witness statement format
  return facts
    .filter(f => f && f.trim().length > 5)
    .map((fact, i) => {
      // Clean up the fact and format it properly
      let cleanFact = fact.trim();
      
      // Remove prefixes like "The other party is:" for witness statement context
      cleanFact = cleanFact.replace(/^the other party is:\s*/i, 'The defendant is ');
      cleanFact = cleanFact.replace(/^the claimant is:\s*/i, 'I am ');
      cleanFact = cleanFact.replace(/^amount claimed:\s*/i, 'The amount owed to me is ');
      cleanFact = cleanFact.replace(/^legal relationship:\s*/i, 'My relationship with the defendant is ');
      
      return `2.${i + 1} ${cleanFact}`;
    })
    .join('\n\n');
}

function extractEmployerName(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const text = facts.join(" ");
  
  // Look for company names, employer mentions
  const patterns = [
    /(?:employer|company|business|firm|organisation)(?:'s)?\s+(?:is|was|called)?\s*:?\s*([A-Z][A-Za-z0-9\s&Ltd.]+)/i,
    /(?:works?|worked)\s+(?:for|at)\s+([A-Z][A-Za-z0-9\s&Ltd.]+)/i,
    /([A-Z][A-Za-z0-9\s&]+(?:Ltd|Limited|LLP|plc))/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Check for specific known names in facts
  if (text.includes("24TM")) return "24TM";
  if (text.includes("Marvin")) return "Marvin's company [User to complete full name]";
  
  return null;
}

function extractEmployerAddress(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const addressFact = facts.find(f => 
    f.toLowerCase().includes("address") ||
    f.toLowerCase().includes("located") ||
    f.toLowerCase().includes("street") ||
    f.toLowerCase().includes("road") ||
    /\d+\s+[A-Z][a-z]+\s+(?:Street|Road|Avenue|Lane|Close)/i.test(f)
  );
  return addressFact || null;
}

function extractBusinessType(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const text = facts.join(" ").toLowerCase();
  
  if (text.includes("traffic management")) return "Traffic Management Services";
  if (text.includes("construction")) return "Construction";
  if (text.includes("retail")) return "Retail";
  if (text.includes("hospitality")) return "Hospitality";
  if (text.includes("healthcare")) return "Healthcare";
  
  return null;
}

function extractJobTitle(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const text = facts.join(" ");
  
  const patterns = [
    /(?:job title|position|role)(?:\s+was|\s+is)?\s*:?\s*([A-Za-z\s]+)/i,
    /(?:worked as|employed as)\s+(?:a|an)?\s*([A-Za-z\s]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  if (text.toLowerCase().includes("traffic management")) return "Traffic Management Operative";
  
  return null;
}

function extractStartDate(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const dateFact = facts.find(f => 
    f.toLowerCase().includes("start") ||
    f.toLowerCase().includes("began") ||
    f.toLowerCase().includes("commenced")
  );
  
  if (dateFact) {
    const dateMatch = dateFact.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    if (dateMatch) return dateMatch[1];
  }
  
  return null;
}

function extractEndDate(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const dateFact = facts.find(f => 
    f.toLowerCase().includes("end") ||
    f.toLowerCase().includes("left") ||
    f.toLowerCase().includes("terminated") ||
    f.toLowerCase().includes("dismissed")
  );
  
  if (dateFact) {
    const dateMatch = dateFact.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    if (dateMatch) return dateMatch[1];
  }
  
  return null;
}

function determineEmploymentContinuing(strategy: CaseStrategy): string {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const text = facts.join(" ").toLowerCase();
  
  if (text.includes("still employed") || text.includes("continuing")) return "☒ Yes";
  if (text.includes("left") || text.includes("ended") || text.includes("terminated") || text.includes("dismissed")) return "☒ No";
  
  return "☐ Yes  ☐ No [User to complete]";
}

function extractWorkingHours(strategy: CaseStrategy): string | null {
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const text = facts.join(" ");
  
  const match = text.match(/(\d+)\s*hours?/i);
  return match ? match[1] : null;
}

function determineClaimTypes(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  
  let types = "";
  
  if (text.includes("unpaid") || text.includes("not paid") || text.includes("owes") || text.includes("wages")) {
    types += "☒ Breach of contract - unauthorised deduction from wages/unpaid wages\n";
  }
  
  if (text.includes("dismissed") || text.includes("sacked") || text.includes("fired") || text.includes("termination")) {
    types += "☒ Unfair dismissal\n";
  }
  
  if (text.includes("discriminat") || text.includes("harass")) {
    types += "☒ Discrimination (specify protected characteristic above)\n";
  }
  
  if (text.includes("redundancy") || text.includes("redundant")) {
    types += "☒ Redundancy payment\n";
  }
  
  if (text.includes("notice") && text.includes("pay")) {
    types += "☒ Notice pay\n";
  }
  
  if (text.includes("holiday") && text.includes("pay")) {
    types += "☒ Holiday pay\n";
  }
  
  if (!types) {
    types = "☐ Unfair dismissal\n☐ Breach of contract\n☐ Discrimination\n☒ Other (specify in details below)";
  }
  
  return types;
}

function generateEmploymentClaimNarrative(
  strategy: CaseStrategy,
  evidence: EvidenceItem[],
  facts: string[]
): string {
  let narrative = "";
  
  // Opening paragraph
  narrative += "BACKGROUND AND EMPLOYMENT RELATIONSHIP:\n\n";
  narrative += "[Start with how and when the employment began, what was agreed]\n\n";
  
  // Main facts
  narrative += "CHRONOLOGY OF EVENTS:\n\n";
  facts.forEach((fact, i) => {
    narrative += `${i + 1}. ${fact}\n\n`;
  });
  
  // Evidence
  if (evidence.length > 0) {
    narrative += "\nEVIDENCE IN SUPPORT:\n\n";
    narrative += "I have the following evidence to support my claim:\n\n";
    evidence.forEach((e, i) => {
      narrative += `• ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}\n`;
    });
    narrative += "\nThis evidence is provided in a separate evidence bundle and demonstrates the facts as stated above.\n\n";
  }
  
  // Legal basis
  narrative += "WHY THE RESPONDENT'S ACTIONS WERE UNLAWFUL/BREACH:\n\n";
  narrative += "[Explain why the employer's actions constitute unfair dismissal / breach of contract / discrimination etc.]\n\n";
  narrative += "[Reference relevant employment law, contractual terms, or statutory rights]\n\n";
  
  return narrative;
}

function extractCompensationAmount(strategy: CaseStrategy): string | null {
  const outcome = strategy.desiredOutcome || "";
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const allText = `${outcome} ${facts.join(" ")}`;
  
  const match = allText.match(/£([\d,]+(?:\.\d{2})?)/);
  return match ? match[1].replace(/,/g, "") : null;
}

function extractDefendantName(strategy: CaseStrategy): string | null {
  return extractEmployerName(strategy);
}

function extractMonetaryAmount(strategy: CaseStrategy): string | null {
  return extractCompensationAmount(strategy);
}

function determineInterestBasis(ctx: FormTemplateContext): string {
  const amount = extractMonetaryAmount(ctx.strategy);
  if (amount && parseFloat(amount) > 5000) {
    return "section 69 of the County Courts Act 1984 at 8% per annum";
  }
  return "section 69 of the County Courts Act 1984 at 8% per annum";
}

function generateParticularsOfClaim(ctx: FormTemplateContext): string {
  const facts = ctx.facts;
  let particulars = "";
  let para = 1;
  
  particulars += `${para}. The Claimant is [describe yourself - individual, sole trader, company, etc.].\n\n`;
  para++;
  
  particulars += `${para}. The Defendant is ${extractDefendantName(ctx.strategy) || "[defendant name and description]"}.\n\n`;
  para++;
  
  particulars += `${para}. THE AGREEMENT/CONTRACT\n\n`;
  particulars += `   On or around [date], the Claimant and Defendant entered into an agreement whereby:\n`;
  particulars += `   [Describe the contract/agreement - what was agreed, terms, price, etc.]\n\n`;
  para++;
  
  particulars += `${para}. THE CLAIMANT'S PERFORMANCE\n\n`;
  facts.forEach((fact, i) => {
    if (fact.toLowerCase().includes("i") || fact.toLowerCase().includes("claimant") || fact.toLowerCase().includes("work") || fact.toLowerCase().includes("did")) {
      particulars += `   ${para}.${i + 1} ${fact}\n`;
    }
  });
  particulars += `\n   The Claimant thereby fully performed their obligations under the agreement.\n\n`;
  para++;
  
  particulars += `${para}. THE DEFENDANT'S BREACH\n\n`;
  particulars += `   In breach of the agreement, the Defendant [state what they did wrong - failed to pay, breached terms, etc.]:\n`;
  particulars += `   [List specific breaches with dates]\n\n`;
  para++;
  
  particulars += `${para}. CAUSATION AND LOSS\n\n`;
  particulars += `   As a direct result of the Defendant's breach, the Claimant has suffered loss and damage.\n\n`;
  para++;
  
  particulars += `${para}. PARTICULARS OF LOSS\n\n`;
  particulars += `   ${para}.1 [Type of loss]: £${extractMonetaryAmount(ctx.strategy) || "_______"}\n`;
  particulars += `   ${para}.2 [Other losses if applicable]: £_______\n\n`;
  particulars += `   TOTAL: £${extractMonetaryAmount(ctx.strategy) || "_______"}\n\n`;
  para++;
  
  if (ctx.evidence.length > 0) {
    particulars += `${para}. EVIDENCE\n\n`;
    particulars += `   The Claimant relies upon the following evidence:\n\n`;
    ctx.evidence.forEach((e, i) => {
      particulars += `   ${para}.${i + 1} ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}\n`;
    });
    particulars += `\n`;
    para++;
  }
  
  particulars += `${para}. INTEREST\n\n`;
  particulars += `   The Claimant claims interest pursuant to ${determineInterestBasis(ctx)} from [date] to the date of judgment.\n\n`;
  
  return particulars;
}

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS FOR NEW TEMPLATES
// ============================================================================

function generateLBAFactsSection(facts: string[]): string {
  if (!facts || facts.length === 0) {
    return "[Set out the background facts - what happened, when, where, who was involved]\n\n[Be chronological and factual]";
  }
  
  let section = "";
  facts.forEach((fact, i) => {
    section += `${i + 1}. ${fact}\n\n`;
  });
  return section;
}

function generateLBAClaimSection(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  let claim = "";
  
  if (text.includes("unpaid") || text.includes("not paid") || text.includes("owes")) {
    claim += "You owe me the sum of £" + (extractMonetaryAmount(strategy) || "_______") + " for [reason - goods supplied, services rendered, breach of contract, etc.].\n\n";
  } else {
    claim += "[State clearly what you are claiming - money owed, breach of contract, negligence, etc.]\n\n";
  }
  
  claim += "[Explain the basis of the claim - what agreement was made, what went wrong, etc.]\n\n";
  
  return claim;
}

function generateLBALegalBasis(strategy: CaseStrategy, facts: string[]): string {
  // Import case law dynamically to avoid circular deps
  const { getCasesForDisputeType, getStatutesForDisputeType, formatCitation } = require("@/lib/legal/uk-case-law");
  
  const text = facts.join(" ").toLowerCase();
  const disputeType = (strategy as any).disputeType || "";
  let basis = "";
  
  // Basic legal grounds
  if (text.includes("contract") || text.includes("agreement")) {
    basis += "• Breach of contract\n";
  }
  if (text.includes("unpaid") || text.includes("not paid") || text.includes("wages")) {
    basis += "• Debt/Unpaid sums\n";
  }
  if (text.includes("negligent") || text.includes("negligence")) {
    basis += "• Negligence\n";
  }
  if (text.includes("misrepresent") || text.includes("misleading")) {
    basis += "• Misrepresentation\n";
  }
  if (text.includes("faulty") || text.includes("defect") || text.includes("not working")) {
    basis += "• Breach of statutory implied terms (Consumer Rights Act 2015)\n";
  }
  
  if (!basis) {
    basis = "• [State the legal basis - contract, tort, statute, etc.]\n";
  }
  
  // Add statutory references
  const statutes = getStatutesForDisputeType(disputeType);
  if (statutes.length > 0) {
    basis += "\nSTATUTORY BASIS:\n";
    for (const { statute, sections } of statutes.slice(0, 2)) {
      for (const section of sections.slice(0, 3)) {
        basis += `• ${statute.shortName} ${section.section}: ${section.description}\n`;
      }
    }
  }
  
  // Add case law citations
  const cases = getCasesForDisputeType(disputeType);
  if (cases.length > 0) {
    basis += "\nRELEVANT CASE LAW:\n";
    for (const caseCitation of cases.slice(0, 2)) {
      basis += `• ${formatCitation(caseCitation)}\n`;
      basis += `  (${caseCitation.holding.toLowerCase()})\n`;
    }
  }
  
  return basis;
}

function generateEvidenceSection(evidence: EvidenceItem[], ...keywords: string[]): string {
  if (!evidence || evidence.length === 0) {
    return "[No documents in this section]";
  }
  
  const filtered = evidence.filter(e => {
    const text = (e.title || e.fileName || e.description || "").toLowerCase();
    return keywords.length === 0 || keywords.some(k => text.includes(k.toLowerCase()));
  });
  
  if (filtered.length === 0) {
    return "[No documents in this section]";
  }
  
  let section = "";
  filtered.forEach((e, i) => {
    section += `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}\n`;
    if (e.evidenceDate) {
      section += `   Date: ${e.evidenceDate.toLocaleDateString("en-GB")}\n`;
    }
    section += `   Bundle pages: [User to complete]\n\n`;
  });
  
  return section;
}

function generateLossOfEarningsSchedule(strategy: CaseStrategy, facts: string[]): string {
  const amount = extractMonetaryAmount(strategy);
  if (!amount) {
    return `Period: [From date] to [To date]
Weekly/monthly earnings: £_______
Number of weeks/months: _______
Calculation: £_______ × _______ = £_______

[Repeat for each period of loss]`;
  }
  
  return `Period: [From date] to [To date]
Weekly/monthly earnings: £[User to complete]
Number of weeks/months: [User to complete]
Calculation: £[amount] × [weeks] = £${amount}

[Repeat for each period of loss]`;
}

function generateLossOfBenefitsSchedule(strategy: CaseStrategy): string {
  return `[List any benefits lost - pension contributions, health insurance, company car, etc.]

Benefit: [Type of benefit]
Value per month: £_______
Period of loss: [From] to [To]
Total: £_______

[Repeat for each benefit]`;
}

function generateExpensesSchedule(strategy: CaseStrategy, evidence: EvidenceItem[]): string {
  return `[List expenses incurred as a result of the matter]

Expense: [Description]
Amount: £_______
Date: [Date]
Receipt/Evidence: [Reference to evidence bundle]

Total expenses: £_______

[Repeat for each expense]`;
}

function generateOtherPastLosses(strategy: CaseStrategy): string {
  return `[Any other past losses - loss of opportunity, damage to property, etc.]

Description: [Description]
Amount: £_______
Evidence: [Reference to evidence]

Total: £_______`;
}

function generateFutureLossOfEarnings(strategy: CaseStrategy): string {
  return `[If employment has ended and you are claiming future loss]

Expected period of unemployment: [Number] weeks/months
Weekly/monthly earnings: £_______
Calculation: £_______ × _______ = £_______

OR

Multiplier approach: [Use Ogden Tables if applicable]
Multiplier: _______
Annual loss: £_______
Total future loss: £_______`;
}

function generateFuturePensionLoss(strategy: CaseStrategy): string {
  return `[If claiming loss of pension rights]

Annual pension loss: £_______
Multiplier: [From Ogden Tables]
Total pension loss: £_______`;
}

function generateFutureMedicalCosts(strategy: CaseStrategy): string {
  return `[If claiming future medical/rehabilitation costs]

Treatment: [Description]
Cost: £_______
Frequency: [How often]
Period: [How long]
Total: £_______

[Repeat for each treatment]`;
}

function generateOtherFutureLosses(strategy: CaseStrategy): string {
  return `[Any other future losses]

Description: [Description]
Amount: £_______
Period: [How long]
Total: £_______`;
}

function generateGeneralDamagesSchedule(strategy: CaseStrategy): string {
  return `[For personal injury or discrimination cases]

Nature of injury/discrimination: [Description]
Severity: [Mild/Moderate/Severe]
Duration: [How long]
Impact on daily life: [Description]

Guideline amount (from Judicial College Guidelines or Vento bands): £_______
Adjustment for: [Specific factors]
Final amount: £_______`;
}

function generateInjuryToFeelingsSchedule(strategy: CaseStrategy): string {
  return `[For discrimination cases - use Vento bands]

Lower band (less serious): £900 - £9,000
Middle band (moderately serious): £9,000 - £27,000
Upper band (serious): £27,000 - £45,000
Exceptional cases: £45,000+

My claim falls within: ☐ Lower ☐ Middle ☐ Upper ☐ Exceptional

Amount claimed: £_______`;
}

function determineBenefitType(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  
  if (text.includes("pip") || text.includes("personal independence")) return "☒ Personal Independence Payment (PIP)";
  if (text.includes("esa") || text.includes("employment support")) return "☒ Employment and Support Allowance (ESA)";
  if (text.includes("universal credit")) return "☒ Universal Credit";
  if (text.includes("dla") || text.includes("disability living")) return "☒ Disability Living Allowance (DLA)";
  if (text.includes("attendance allowance")) return "☒ Attendance Allowance";
  if (text.includes("carer")) return "☒ Carer's Allowance";
  if (text.includes("housing benefit")) return "☒ Housing Benefit";
  if (text.includes("council tax")) return "☒ Council Tax Reduction";
  
  return `☐ Personal Independence Payment (PIP)
☐ Employment and Support Allowance (ESA)
☐ Universal Credit
☐ Disability Living Allowance (DLA)
☐ Attendance Allowance
☐ Carer's Allowance
☐ Housing Benefit
☐ Council Tax Reduction
☐ Other: _______________________________`;
}

function generateBenefitDecisionDescription(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  let desc = "";
  
  if (text.includes("refused") || text.includes("rejected") || text.includes("denied")) {
    desc += "The decision maker refused my application for [benefit name].\n\n";
  }
  if (text.includes("reduced") || text.includes("lower")) {
    desc += "The decision maker reduced my benefit award.\n\n";
  }
  if (text.includes("stopped") || text.includes("ended") || text.includes("terminated")) {
    desc += "The decision maker stopped my benefit.\n\n";
  }
  
  desc += "[Describe the decision - what was decided, what rate/amount was awarded (if any)]\n\n";
  desc += "[Explain why you disagree with the decision]\n";
  
  return desc;
}

function generateBenefitAppealGrounds(strategy: CaseStrategy, facts: string[], evidence: EvidenceItem[]): string {
  let grounds = "";
  
  grounds += "I believe the decision is wrong because:\n\n";
  
  facts.forEach((fact, i) => {
    if (fact.toLowerCase().includes("wrong") || fact.toLowerCase().includes("incorrect") || fact.toLowerCase().includes("mistake")) {
      grounds += `${i + 1}. ${fact}\n\n`;
    }
  });
  
  if (evidence.length > 0) {
    grounds += "\nI have evidence to support my appeal:\n\n";
    evidence.forEach((e, i) => {
      grounds += `• ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}\n`;
    });
  }
  
  grounds += "\n[Explain in detail why the decision is wrong - refer to the law, regulations, medical evidence, etc.]\n";
  
  return grounds;
}

function generateMedicalEvidenceList(evidence: EvidenceItem[]): string {
  const medical = evidence.filter(e => {
    const text = (e.title || e.fileName || e.description || "").toLowerCase();
    return text.includes("medical") || text.includes("doctor") || text.includes("gp") || text.includes("hospital") || text.includes("report");
  });
  
  if (medical.length === 0) {
    return "[List medical evidence - GP letters, consultant reports, hospital records, etc.]";
  }
  
  return medical.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n");
}

function determinePOPLAGrounds(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  let grounds = "";
  
  if (text.includes("sign") && (text.includes("unclear") || text.includes("not visible") || text.includes("missing"))) {
    grounds += "☒ The signage was unclear, not visible, or missing\n";
  }
  if (text.includes("paid") || text.includes("payment")) {
    grounds += "☒ I had paid for parking\n";
  }
  if (text.includes("permit") || text.includes("authorised")) {
    grounds += "☒ I had a valid permit or authorisation\n";
  }
  if (text.includes("broken") || text.includes("fault") || text.includes("not working")) {
    grounds += "☒ The parking meter/machine was broken or not working\n";
  }
  if (text.includes("emergency") || text.includes("medical")) {
    grounds += "☒ There were mitigating circumstances (emergency, medical, etc.)\n";
  }
  if (text.includes("incorrect") || text.includes("wrong") || text.includes("error")) {
    grounds += "☒ The parking charge notice contains errors\n";
  }
  if (text.includes("not my car") || text.includes("wrong vehicle")) {
    grounds += "☒ The vehicle details are incorrect\n";
  }
  
  if (!grounds) {
    grounds = `☐ The signage was unclear, not visible, or missing
☐ I had paid for parking
☐ I had a valid permit or authorisation
☐ The parking meter/machine was broken or not working
☐ There were mitigating circumstances
☐ The parking charge notice contains errors
☐ The vehicle details are incorrect
☐ Other: _______________________________`;
  }
  
  return grounds;
}

function generatePOPLAAppealExplanation(strategy: CaseStrategy, facts: string[], evidence: EvidenceItem[]): string {
  let explanation = "";
  
  explanation += "[Explain in detail why the parking charge should be cancelled]\n\n";
  
  facts.forEach((fact, i) => {
    explanation += `${i + 1}. ${fact}\n\n`;
  });
  
  if (evidence.length > 0) {
    explanation += "\nI have the following evidence:\n\n";
    evidence.forEach((e, i) => {
      explanation += `• ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}\n`;
    });
  }
  
  return explanation;
}

function generatePOPLAMitigatingCircumstances(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  
  if (text.includes("emergency") || text.includes("medical") || text.includes("urgent")) {
    return "[Explain the mitigating circumstances - emergency, medical situation, etc.]\n\n[Explain why you could not comply with the parking terms]";
  }
  
  return "☐ Yes (please explain): _______________________________\n☐ No";
}

function generatePOPLAOperatorResponse(strategy: CaseStrategy): string {
  return "[Describe the parking operator's response to your initial appeal]\n\n[What did they say? Did they reject your appeal? What were their reasons?]";
}

function generateMitigationAcknowledgment(strategy: CaseStrategy, facts: string[]): string {
  return "[Acknowledge the offence clearly and show genuine remorse]\n\n[Accept responsibility without making excuses]";
}

function generateMitigationCircumstances(strategy: CaseStrategy, facts: string[]): string {
  let circumstances = "";
  
  facts.forEach((fact, i) => {
    circumstances += `${i + 1}. ${fact}\n\n`;
  });
  
  if (!circumstances) {
    circumstances = "[Explain what led to the offence - but do not make excuses]\n\n[Be honest and factual]";
  }
  
  return circumstances;
}

function generateMitigationRemorse(strategy: CaseStrategy): string {
  return `• The seriousness of my actions
• The impact on others
• Why my actions were wrong
• What I should have done instead

[Show genuine insight and understanding]`;
}

function generateMitigationFinancialCircumstances(strategy: CaseStrategy): string {
  return "[Explain your financial situation - income, outgoings, dependents, etc.]\n\n[This helps the court assess your ability to pay fines]";
}

function generateMitigationHealthCircumstances(strategy: CaseStrategy): string {
  return "[Explain any health issues - physical or mental - that may be relevant]\n\n[Include medical evidence if applicable]";
}

function generateMitigationFamilyCircumstances(strategy: CaseStrategy): string {
  return "[Explain family circumstances - dependents, caring responsibilities, etc.]\n\n[Explain how a harsh sentence would affect your family]";
}

function generateMitigationEmploymentCircumstances(strategy: CaseStrategy): string {
  return `[Explain employment situation]

Current employment: ${extractJobTitle(strategy) || "[Your job]"}
Risk to employment: [Would a conviction/fine affect your job?]
Financial impact: [How would losing your job affect you and your family?]`;
}

function generateMitigationCharacterReferences(evidence: EvidenceItem[]): string {
  const refs = evidence.filter(e => {
    const text = (e.title || e.fileName || e.description || "").toLowerCase();
    return text.includes("reference") || text.includes("character") || text.includes("witness");
  });
  
  if (refs.length === 0) {
    return "[List character references - from employer, community leaders, etc.]\n\n[Attach reference letters if available]";
  }
  
  return refs.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}`).join("\n");
}

function generateMitigationCommunityInvolvement(strategy: CaseStrategy): string {
  return "[Describe any community involvement - volunteering, charity work, etc.]\n\n[Show positive contributions to society]";
}

function generateMitigationStepsTaken(strategy: CaseStrategy, facts: string[]): string {
  return `[List steps taken to address the issue]

Examples:
• Completed a course (specify which)
• Sought help/treatment (specify what)
• Changed behaviour/lifestyle
• Made amends/apologised
• Other actions taken

[Be specific and show genuine effort to change]`;
}

function generateMitigationImpactOfSentence(strategy: CaseStrategy): string {
  return `[Explain the impact of different possible sentences]

• Impact of a fine: [Financial hardship]
• Impact of community order: [Time/work commitments]
• Impact of disqualification (if applicable): [Loss of licence, job, etc.]
• Impact of custodial sentence: [Family, employment, etc.]

[Be honest but not overly dramatic]`;
}

function determineImmigrationDecisionType(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  
  if (text.includes("visa") && text.includes("refus")) return "☒ Visa refusal";
  if (text.includes("leave to remain") || text.includes("lt")) return "☒ Leave to remain refusal";
  if (text.includes("deport") || text.includes("removal")) return "☒ Deportation/removal order";
  if (text.includes("citizenship") || text.includes("naturalisation")) return "☒ Citizenship/naturalisation refusal";
  if (text.includes("asylum")) return "☒ Asylum decision";
  
  return `☐ Visa refusal
☐ Leave to remain refusal
☐ Deportation/removal order
☐ Citizenship/naturalisation refusal
☐ Asylum decision
☐ Other: _______________________________`;
}

function generateImmigrationDecisionDescription(strategy: CaseStrategy, facts: string[]): string {
  let desc = "";
  
  facts.forEach((fact, i) => {
    if (fact.toLowerCase().includes("refused") || fact.toLowerCase().includes("rejected") || fact.toLowerCase().includes("denied")) {
      desc += `${i + 1}. ${fact}\n\n`;
    }
  });
  
  if (!desc) {
    desc = "[Describe the decision - what was refused, what reasons were given, etc.]\n";
  }
  
  return desc;
}

function determineImmigrationAppealGrounds(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  let grounds = "";
  
  if (text.includes("wrong") || text.includes("incorrect") || text.includes("error")) {
    grounds += "☒ The decision is wrong in law\n";
  }
  if (text.includes("evidence") && (text.includes("ignored") || text.includes("not considered"))) {
    grounds += "☒ Relevant evidence was not considered\n";
  }
  if (text.includes("human rights") || text.includes("article 8")) {
    grounds += "☒ Breach of human rights (Article 8 ECHR)\n";
  }
  if (text.includes("procedural") || text.includes("unfair")) {
    grounds += "☒ Procedural unfairness\n";
  }
  
  if (!grounds) {
    grounds = `☐ The decision is wrong in law
☐ Relevant evidence was not considered
☐ Breach of human rights (Article 8 ECHR)
☐ Procedural unfairness
☐ Other: _______________________________`;
  }
  
  return grounds;
}

function generateImmigrationAppealExplanation(strategy: CaseStrategy, facts: string[], evidence: EvidenceItem[]): string {
  let explanation = "";
  
  explanation += "[Explain in detail why the decision is wrong]\n\n";
  
  facts.forEach((fact, i) => {
    explanation += `${i + 1}. ${fact}\n\n`;
  });
  
  if (evidence.length > 0) {
    explanation += "\nI have the following evidence:\n\n";
    evidence.forEach((e, i) => {
      explanation += `• ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ""}\n`;
    });
  }
  
  return explanation;
}

function generateHumanRightsClaim(strategy: CaseStrategy, facts: string[]): string {
  return "[Explain your Article 8 claim - right to family/private life]\n\n[Explain your family ties, private life, length of residence, etc.]\n\n[Explain why removal would be disproportionate]";
}

function generateFamilyMembersAffected(strategy: CaseStrategy): string {
  return `[List family members who would be affected]

Name: [Name]
Relationship: [Relationship]
Age: [Age]
Status: [British citizen/Permanent resident/etc.]
Impact: [How would they be affected?]

[Repeat for each family member]`;
}

function generateGrievanceReason(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  
  if (text.includes("discriminat") || text.includes("harass")) return "[I have been subjected to discrimination/harassment]";
  if (text.includes("bully")) return "[I have been subjected to bullying]";
  if (text.includes("unfair") || text.includes("unjust")) return "[I have been treated unfairly]";
  if (text.includes("not paid") || text.includes("unpaid")) return "[I have not been paid what I am owed]";
  
  return "[Brief reason for raising the grievance]";
}

function determineGrievanceType(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  let types = "";
  
  if (text.includes("discriminat")) types += "☒ Discrimination\n";
  if (text.includes("harass") || text.includes("bully")) types += "☒ Harassment/Bullying\n";
  if (text.includes("unpaid") || text.includes("not paid")) types += "☒ Unpaid wages\n";
  if (text.includes("unfair") || text.includes("unjust")) types += "☒ Unfair treatment\n";
  if (text.includes("grievance") || text.includes("complaint")) types += "☒ General grievance\n";
  
  if (!types) {
    types = "☐ Discrimination\n☐ Harassment/Bullying\n☐ Unpaid wages\n☐ Unfair treatment\n☐ Other: _______________________________";
  }
  
  return types;
}

function generateGrievanceChronology(facts: string[]): string {
  if (!facts || facts.length === 0) {
    return "[Set out events in chronological order with dates]\n\n[Be specific and factual]";
  }
  
  let chronology = "";
  facts.forEach((fact, i) => {
    chronology += `${i + 1}. ${fact}\n\n`;
  });
  
  return chronology;
}

function generateGrievanceIncidents(strategy: CaseStrategy, facts: string[]): string {
  return "[Describe specific incidents with dates, times, locations, who was involved, what was said/done]\n\n[Be detailed and factual]";
}

function generateGrievanceImpact(strategy: CaseStrategy): string {
  return "[Explain how this has affected you - emotionally, financially, professionally, health, etc.]\n\n[Be honest but professional]";
}

function generatePreviousResolutionAttempts(strategy: CaseStrategy, facts: string[]): string {
  return "[Describe any previous attempts to resolve this informally - conversations, emails, meetings, etc.]\n\n[Explain why informal resolution did not work]";
}

function generateGrievanceWitnesses(strategy: CaseStrategy): string {
  return "[List any witnesses who can support your grievance]\n\nName: [Name]\nRole: [Their role]\nWhat they witnessed: [Description]\n\n[Repeat for each witness]";
}

function generateGrievanceDesiredOutcome(strategy: CaseStrategy, facts: string[]): string {
  return `[Specify what you want to happen]

Examples:
• An apology
• The behaviour to stop
• Disciplinary action against the person(s) involved
• Compensation
• Policy changes
• Other: [Specify]

[Be clear and reasonable]`;
}

function generateComplaintSubject(strategy: CaseStrategy, facts: string[]): string {
  return "[What is the complaint about? - poor service, faulty goods, billing error, etc.]";
}

function generateComplaintTransactionDetails(strategy: CaseStrategy, facts: string[]): string {
  return `[Provide details of the transaction/service]

Date: ${extractStartDate(strategy) || "[Date]"}
Reference/Account number: [If applicable]
Amount: £${extractMonetaryAmount(strategy) || "_______"}
Description: [What was purchased/service received]`;
}

function generateComplaintDetails(strategy: CaseStrategy, facts: string[]): string {
  let details = "";
  
  facts.forEach((fact, i) => {
    details += `${i + 1}. ${fact}\n\n`;
  });
  
  if (!details) {
    details = "[Explain clearly what went wrong]\n\n[Be specific and factual]";
  }
  
  return details;
}

function generateComplaintChronology(facts: string[]): string {
  return generateGrievanceChronology(facts);
}

function generateComplaintImpact(strategy: CaseStrategy): string {
  return "[Explain how this has affected you - inconvenience, financial loss, distress, etc.]";
}

function generateComplaintPreviousContact(strategy: CaseStrategy, facts: string[]): string {
  return "[Describe any previous contact - phone calls, emails, letters, etc.]\n\n[Include dates and who you spoke to]";
}

function generateComplaintPreviousResponse(strategy: CaseStrategy): string {
  return "[Describe their response - what did they say? Was it satisfactory?]";
}

function generateComplaintDesiredOutcome(strategy: CaseStrategy, facts: string[]): string {
  return `[Specify what you want]

Examples:
• A full refund
• Replacement/repair
• Compensation
• An apology
• Corrective action
• Other: [Specify]

Amount claimed: £${extractMonetaryAmount(strategy) || "_______"}`;
}

function determineRelevantOmbudsman(strategy: CaseStrategy): string {
  const text = (strategy.keyFacts || []).join(" ").toLowerCase();
  
  if (text.includes("bank") || text.includes("financial")) return "Financial Ombudsman Service";
  if (text.includes("energy") || text.includes("gas") || text.includes("electric")) return "Energy Ombudsman";
  if (text.includes("telecom") || text.includes("phone") || text.includes("broadband")) return "Communications Ombudsman";
  if (text.includes("property") || text.includes("letting")) return "Property Ombudsman";
  
  return "[Relevant ombudsman/regulator - e.g., Financial Ombudsman, Energy Ombudsman, etc.]";
}

function determineFinancialServiceType(strategy: CaseStrategy, facts: string[]): string {
  const text = facts.join(" ").toLowerCase();
  
  if (text.includes("bank") || text.includes("current account") || text.includes("savings")) return "☒ Banking (current account, savings account)";
  if (text.includes("credit card")) return "☒ Credit card";
  if (text.includes("loan") || text.includes("mortgage")) return "☒ Loan/Mortgage";
  if (text.includes("insurance")) return "☒ Insurance";
  if (text.includes("investment") || text.includes("pension")) return "☒ Investment/Pension";
  if (text.includes("payment") || text.includes("transfer")) return "☒ Payment services";
  
  return `☐ Banking (current account, savings account)
☐ Credit card
☐ Loan/Mortgage
☐ Insurance
☐ Investment/Pension
☐ Payment services
☐ Other: _______________________________`;
}

function generateFOSComplaintDescription(strategy: CaseStrategy, facts: string[]): string {
  return "[Describe your complaint clearly]\n\n[What went wrong? What should have happened?]";
}

function generateFOSChronology(facts: string[]): string {
  return generateGrievanceChronology(facts);
}

function generateFOSWhatWentWrong(strategy: CaseStrategy, facts: string[]): string {
  return "[Explain what went wrong]\n\n[Be specific about the provider's actions or failures]";
}

function generateFOSImpact(strategy: CaseStrategy): string {
  return "[Explain how this has affected you - financial loss, inconvenience, distress, etc.]";
}

function generateFOSProviderResponse(strategy: CaseStrategy): string {
  return "[Describe the provider's response to your complaint]\n\n[What did they say? Why are you not satisfied?]";
}

function generateFOSDesiredOutcome(strategy: CaseStrategy, facts: string[]): string {
  return `[What outcome are you seeking?]

Examples:
• A full refund
• Compensation for losses
• Correction of error
• Apology
• Other: [Specify]`;
}

function generateFOSAmountBreakdown(strategy: CaseStrategy): string {
  const amount = extractMonetaryAmount(strategy);
  return `Principal amount: £${amount || "_______"}
Interest: £_______
Other losses: £_______
Total: £${amount || "_______"}

[Break down how you calculated the amount]`;
}

function generateFOSAdditionalInfo(strategy: CaseStrategy, facts: string[]): string {
  return "[Any other relevant information]\n\n[Anything else the FOS should know?]";
}

/**
 * Extract claimant/user name from case facts
 * Looks for "The claimant is:" pattern in enriched facts
 */
function extractClaimantName(strategy: CaseStrategy, user?: UserProfile): string | null {
  // First check user profile (most reliable source)
  if (user && (user.firstName || user.lastName)) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }
  
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  for (const fact of facts) {
    // Check for "The claimant is:" pattern (added by trigger-generation)
    const claimantMatch = fact.match(/(?:The claimant is|claimant is|claimant:)\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
    if (claimantMatch) return claimantMatch[1].trim();
  }
  
  // Fallback to strategy extension
  if ((strategy as any).claimantName) {
    return (strategy as any).claimantName;
  }
  
  return null;
}

/**
 * Extract claimant email from case facts
 */
function extractClaimantEmail(strategy: CaseStrategy, user?: UserProfile): string | null {
  // First check user profile (most reliable source)
  if (user?.email) {
    return user.email;
  }
  
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  for (const fact of facts) {
    // Check for "Claimant email:" pattern (added by trigger-generation)
    const emailMatch = fact.match(/(?:Claimant email|email:)\s*([\w.+-]+@[\w.-]+\.\w+)/i);
    if (emailMatch) return emailMatch[1];
  }
  
  // Fallback to strategy extension
  if ((strategy as any).claimantEmail) {
    return (strategy as any).claimantEmail;
  }
  
  return null;
}

/**
 * Extract claimant address from case facts
 */
function extractClaimantAddress(strategy: CaseStrategy, user?: UserProfile): string | null {
  // First check user profile (most reliable source)
  if (user && (user.addressLine1 || user.city || user.postcode)) {
    const parts = [
      user.addressLine1,
      user.addressLine2,
      user.city,
      user.postcode
    ].filter(Boolean);
    return parts.join('\n');
  }
  
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  for (const fact of facts) {
    // Check for "Claimant address:" pattern
    const addressMatch = fact.match(/(?:Claimant address|My address is|I live at):?\s*(.+)/i);
    if (addressMatch) return addressMatch[1].trim();
  }
  
  return null;
}

// Export helper functions for use in other files
export {
  extractEmployerName,
  extractEmployerAddress,
  extractBusinessType,
  extractJobTitle,
  extractStartDate,
  extractEndDate,
  extractWorkingHours,
  determineClaimTypes,
  extractCompensationAmount,
  extractMonetaryAmount,
  extractDefendantName,
  extractClaimantName,
  extractClaimantEmail,
  extractClaimantAddress,
  generateEmploymentClaimNarrative,
  determineEmploymentContinuing,
  determineInterestBasis,
  generateParticularsOfClaim,
};
