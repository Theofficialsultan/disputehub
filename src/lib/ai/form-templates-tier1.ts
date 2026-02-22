/**
 * TIER 1: SIMPLE LETTER TEMPLATES
 * Direct resolution letters - no court involvement
 */

import type { FormTemplateContext } from "./form-templates-full";
import { formatUserDetails } from "./form-templates-full";

// ============================================================================
// REFUND REQUEST LETTER
// ============================================================================

export function generateRefundRequestLetter(ctx: FormTemplateContext): string {
  const { today, caseTitle, strategy, evidence, user } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Company Name]";
  const amount = (strategy as any).amount || "[Amount]";
  
  // Format user details
  const { fullName, fullAddress, contactBlock } = formatUserDetails(user);
  
  return `
${fullName}
${fullAddress}
${user.email || '[YOUR EMAIL]'}
${user.phone || '[YOUR PHONE]'}

${counterparty}
[COMPANY ADDRESS]
[COMPANY POSTCODE]

Date: ${today}

Dear Sir/Madam,

RE: REQUEST FOR REFUND - £${amount}
[Order/Reference Number: _______]

I am writing to request a full refund of £${amount} for the following reason:

${facts.slice(0, 5).map((f, i) => `${i + 1}. ${f}`).join('\n')}

CONSUMER RIGHTS

Under the Consumer Rights Act 2015, I am entitled to a refund because:

☐ The goods were faulty/not as described
☐ The service was not performed with reasonable care and skill
☐ The goods/services were not delivered within the agreed timeframe
☐ I cancelled within the 14-day cooling-off period (online/distance sale)

[Select the applicable reason above]

WHAT I REQUIRE

I require a full refund of £${amount} to be processed within 14 days of this letter.

Please refund to:
• Original payment method, OR
• Bank account: [Sort code: XX-XX-XX, Account: XXXXXXXX]

If I do not receive the refund within 14 days, I will:
1. Escalate this complaint to relevant ombudsman/trading standards
2. Consider a Section 75 claim (if paid by credit card)
3. Pursue the matter through the County Court

EVIDENCE

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : 'I have retained all receipts, correspondence, and documentation relating to this matter.'}

I look forward to your prompt response.

Yours faithfully,

_______________________
[SIGNATURE]
${fullName}
`.trim();
}

// ============================================================================
// SECTION 75 CREDIT CARD CLAIM
// ============================================================================

export function generateSection75Claim(ctx: FormTemplateContext): string {
  const { today, caseTitle, strategy, evidence, user } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Supplier/Merchant Name]";
  const amount = (strategy as any).amount || "[Amount]";
  
  // Format user details
  const { fullName, fullAddress } = formatUserDetails(user);
  
  return `
═══════════════════════════════════════════════════════════════════════════════
SECTION 75 CLAIM - CONSUMER CREDIT ACT 1974
═══════════════════════════════════════════════════════════════════════════════

${fullName}
${fullAddress}
${user.email || '[YOUR EMAIL]'}
${user.phone || '[YOUR PHONE]'}

[CREDIT CARD PROVIDER]
[DISPUTES DEPARTMENT]
[ADDRESS]
[POSTCODE]

Date: ${today}

Dear Sir/Madam,

RE: SECTION 75 CLAIM - BREACH OF CONTRACT / MISREPRESENTATION
Card ending: **** **** **** [LAST 4 DIGITS]
Transaction amount: £${amount}
Transaction date: [DATE OF PURCHASE]
Supplier: ${counterparty}

───────────────────────────────────────────────────────────────────────────────
LEGAL BASIS
───────────────────────────────────────────────────────────────────────────────

I am making a claim under Section 75 of the Consumer Credit Act 1974, which makes you jointly liable with the supplier for any breach of contract or misrepresentation.

This section applies because:
• The transaction was between £100 and £30,000
• Payment was made using a credit card issued by you
• There has been a breach of contract / misrepresentation by the supplier

───────────────────────────────────────────────────────────────────────────────
THE BREACH / MISREPRESENTATION
───────────────────────────────────────────────────────────────────────────────

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

───────────────────────────────────────────────────────────────────────────────
ATTEMPTS TO RESOLVE WITH SUPPLIER
───────────────────────────────────────────────────────────────────────────────

I have attempted to resolve this directly with ${counterparty}:

• Date contacted: [DATE]
• Method: [Email/Phone/Letter]
• Response received: [Yes/No]
• Outcome: [Refund refused / No response / Unsatisfactory response]

Despite these efforts, the matter remains unresolved.

───────────────────────────────────────────────────────────────────────────────
CLAIM AMOUNT
───────────────────────────────────────────────────────────────────────────────

I am claiming: £${amount}

This represents:
☐ Full purchase price (goods not received / completely defective)
☐ Partial refund (goods partially delivered / partially defective)
☐ Cost of repair / replacement
☐ Consequential losses: £_______ (specify: _______)

───────────────────────────────────────────────────────────────────────────────
EVIDENCE ENCLOSED
───────────────────────────────────────────────────────────────────────────────

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}${e.description ? ` - ${e.description}` : ''}`).join('\n') : `1. Credit card statement showing transaction
2. Correspondence with supplier
3. [Photographs/screenshots of issue]
4. [Contract/Order confirmation]`}

───────────────────────────────────────────────────────────────────────────────
REQUESTED ACTION
───────────────────────────────────────────────────────────────────────────────

Please investigate this claim and:

1. Credit my account with £${amount} within 14 days
2. Confirm in writing that the claim has been accepted
3. If you require further information, please contact me

If I do not receive a satisfactory response within 8 weeks, I will escalate this matter to the Financial Ombudsman Service.

Yours faithfully,

_______________________
[YOUR SIGNATURE]
[YOUR NAME]

═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

// ============================================================================
// CHARGEBACK REQUEST
// ============================================================================

export function generateChargebackRequest(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Merchant Name]";
  const amount = (strategy as any).amount || "[Amount]";
  
  return `
[YOUR NAME]
[YOUR ADDRESS]
[YOUR POSTCODE]

[BANK/CARD PROVIDER]
[DISPUTES DEPARTMENT]
[ADDRESS]

Date: ${today}

Dear Sir/Madam,

RE: CHARGEBACK REQUEST
Card type: [Visa/Mastercard/Amex]
Card ending: **** [LAST 4 DIGITS]
Transaction amount: £${amount}
Transaction date: [DATE]
Merchant: ${counterparty}

I am requesting a chargeback for the above transaction on the following grounds:

REASON FOR CHARGEBACK (tick applicable):

☐ Goods/services not received
☐ Goods not as described
☐ Defective merchandise
☐ Cancelled recurring transaction
☐ Duplicate charge
☐ Fraudulent transaction (not authorised by me)
☐ Credit not processed (refund not received)
☐ Other: _______________________

DETAILS OF DISPUTE:

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

ATTEMPTS TO RESOLVE:

I contacted ${counterparty} on [DATE] to resolve this matter.
Their response: [No response / Refused / Unsatisfactory]

EVIDENCE ATTACHED:

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : `1. Transaction record/statement
2. Correspondence with merchant
3. Proof of issue (photos/screenshots)`}

Please process this chargeback request as soon as possible.

Yours faithfully,

_______________________
[YOUR NAME]
`.trim();
}

// ============================================================================
// WARRANTY CLAIM LETTER
// ============================================================================

export function generateWarrantyClaimLetter(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Manufacturer/Retailer]";
  
  return `
[YOUR NAME]
[YOUR ADDRESS]
[YOUR POSTCODE]
[YOUR EMAIL]

${counterparty}
[WARRANTY/CUSTOMER SERVICE DEPARTMENT]
[ADDRESS]

Date: ${today}

Dear Sir/Madam,

RE: WARRANTY CLAIM
Product: [PRODUCT NAME AND MODEL]
Serial Number: [SERIAL NUMBER]
Date of Purchase: [PURCHASE DATE]
Warranty Reference: [WARRANTY NUMBER if applicable]

I am writing to make a claim under the warranty for the above product.

THE FAULT:

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

The fault first appeared on [DATE] and I have [not used the product since / continued limited use].

WARRANTY ENTITLEMENT:

The product is within the warranty period which:
☐ Is the manufacturer's warranty (expires: ______)
☐ Is an extended warranty purchased separately (policy: ______)
☐ Falls within my statutory rights under the Consumer Rights Act 2015

WHAT I REQUIRE:

Under the warranty terms and the Consumer Rights Act 2015, I request:

☐ Repair of the product
☐ Replacement with identical product
☐ Full refund (if repair/replacement not possible)

EVIDENCE ENCLOSED:

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : `1. Proof of purchase (receipt/invoice)
2. Warranty documentation
3. Photographs showing the fault`}

Please respond within 14 days to arrange collection/repair/replacement.

Yours faithfully,

_______________________
[YOUR NAME]
`.trim();
}

// ============================================================================
// INSURANCE CLAIM LETTER
// ============================================================================

export function generateInsuranceClaimLetter(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Insurance Company]";
  const amount = (strategy as any).amount || "[Estimated Value]";
  
  return `
[YOUR NAME]
[YOUR ADDRESS]
[YOUR POSTCODE]
[YOUR EMAIL]
[YOUR PHONE]

${counterparty}
[CLAIMS DEPARTMENT]
[ADDRESS]

Date: ${today}

Dear Sir/Madam,

RE: INSURANCE CLAIM
Policy Number: [POLICY NUMBER]
Policy Type: [Home/Motor/Travel/Contents/etc.]
Policyholder: [YOUR NAME]
Date of Incident: [DATE]
Claim Reference: [If already allocated]

I am writing to make a claim on my insurance policy for the following:

───────────────────────────────────────────────────────────────────────────────
INCIDENT DETAILS
───────────────────────────────────────────────────────────────────────────────

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

Location of incident: [ADDRESS/LOCATION]
Time of incident: [TIME if known]

───────────────────────────────────────────────────────────────────────────────
ITEMS/DAMAGES CLAIMED
───────────────────────────────────────────────────────────────────────────────

Item/Damage                          | Value/Cost
────────────────────────────────────|──────────────
[Item 1]                            | £_______
[Item 2]                            | £_______
[Item 3]                            | £_______
────────────────────────────────────|──────────────
TOTAL CLAIMED                       | £${amount}

───────────────────────────────────────────────────────────────────────────────
THIRD PARTIES (if applicable)
───────────────────────────────────────────────────────────────────────────────

☐ Police notified (Crime Reference: _______)
☐ Third party involved: [Name/Contact details]
☐ Witnesses: [Name/Contact details]

───────────────────────────────────────────────────────────────────────────────
EVIDENCE ENCLOSED
───────────────────────────────────────────────────────────────────────────────

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : `1. Photographs of damage/incident
2. Receipts/proof of ownership
3. Police report (if applicable)
4. Quotes for repair/replacement`}

Please contact me if you require further information or wish to arrange an inspection.

Yours faithfully,

_______________________
[YOUR NAME]
`.trim();
}

// ============================================================================
// CANCELLATION LETTER
// ============================================================================

export function generateCancellationLetter(ctx: FormTemplateContext): string {
  const { today, strategy } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Company Name]";
  
  return `
[YOUR NAME]
[YOUR ADDRESS]
[YOUR POSTCODE]
[YOUR EMAIL]

${counterparty}
[CANCELLATION/CUSTOMER SERVICE DEPARTMENT]
[ADDRESS]

Date: ${today}

Dear Sir/Madam,

RE: NOTICE OF CANCELLATION
Account/Reference Number: [YOUR ACCOUNT/CONTRACT NUMBER]
Service/Product: [DESCRIPTION]

I hereby give formal notice to cancel my [contract/subscription/membership/service] with immediate effect / on [DATE].

DETAILS:

Account holder: [YOUR NAME]
Account/Contract number: [NUMBER]
Start date: [ORIGINAL START DATE]
Cancellation effective from: [REQUESTED END DATE]

REASON FOR CANCELLATION:

${facts.length > 0 ? facts.map((f, i) => `${i + 1}. ${f}`).join('\n') : `[State reason - optional but may be helpful]`}

LEGAL BASIS (if within cooling-off period):

Under the Consumer Contracts Regulations 2013, I have the right to cancel within 14 days of:
• The contract date (for services)
• Receiving the goods (for goods purchased online/by phone)

[Delete if not applicable]

REQUESTED ACTIONS:

1. Please confirm cancellation in writing within 7 days
2. Process any refund due to me
3. Stop all future payments/direct debits
4. Confirm the final balance on my account

DIRECT DEBIT:

☐ I have also cancelled the Direct Debit with my bank as a precaution
☐ Please confirm you will not attempt to collect further payments

Please send written confirmation of this cancellation to my address above or by email to [YOUR EMAIL].

Yours faithfully,

_______________________
[YOUR NAME]
`.trim();
}

// ============================================================================
// CEASE AND DESIST LETTER
// ============================================================================

export function generateCeaseAndDesistLetter(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Recipient Name]";
  
  return `
PRIVATE AND CONFIDENTIAL
SENT BY [RECORDED DELIVERY / EMAIL WITH READ RECEIPT]

[YOUR NAME]
[YOUR ADDRESS]
[YOUR POSTCODE]

${counterparty}
[ADDRESS]
[POSTCODE]

Date: ${today}

Dear ${counterparty},

RE: FORMAL NOTICE TO CEASE AND DESIST
WITHOUT PREJUDICE SAVE AS TO COSTS

I am writing to demand that you immediately cease and desist from the following conduct:

═══════════════════════════════════════════════════════════════════════════════
THE CONDUCT COMPLAINED OF
═══════════════════════════════════════════════════════════════════════════════

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

═══════════════════════════════════════════════════════════════════════════════
LEGAL BASIS
═══════════════════════════════════════════════════════════════════════════════

Your conduct constitutes [select applicable]:

☐ Harassment contrary to the Protection from Harassment Act 1997
☐ Defamation (libel/slander)
☐ Breach of contract
☐ Infringement of intellectual property rights
☐ Breach of data protection (GDPR)
☐ Nuisance
☐ Breach of confidence
☐ Other: _______________________

═══════════════════════════════════════════════════════════════════════════════
DEMANDS
═══════════════════════════════════════════════════════════════════════════════

I demand that you:

1. IMMEDIATELY cease and desist from the conduct described above
2. [Remove all defamatory material from public view within 24 hours]
3. [Delete all unlawfully held personal data]
4. [Confirm in writing that you will not repeat this conduct]
5. [Other specific demands]

═══════════════════════════════════════════════════════════════════════════════
CONSEQUENCES OF NON-COMPLIANCE
═══════════════════════════════════════════════════════════════════════════════

If you do not comply with these demands within [7/14] days, I will:

1. Report the matter to [relevant authority - e.g., Police, ICO, Trading Standards]
2. Commence legal proceedings against you without further notice
3. Seek an injunction to prevent further conduct
4. Claim damages for all losses suffered

I have retained all evidence of your conduct and will present this in court if necessary.

${evidence.length > 0 ? `\nEVIDENCE RETAINED:\n${evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n')}` : ''}

═══════════════════════════════════════════════════════════════════════════════
RESPONSE REQUIRED
═══════════════════════════════════════════════════════════════════════════════

You must respond to this letter in writing within [7/14] days confirming that:

1. You have ceased the conduct complained of
2. You will not repeat or continue such conduct
3. [Any other specific confirmations required]

Failure to respond will be taken as evidence of your refusal to comply, and I will proceed accordingly.

Yours faithfully,

_______________________
[YOUR NAME]

cc: [Solicitor, if applicable]
`.trim();
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const TIER_1_TEMPLATES: Record<string, (ctx: FormTemplateContext) => string> = {
  "UK-REFUND-REQUEST-LETTER": generateRefundRequestLetter,
  "UK-SECTION-75-CREDIT-CARD-CLAIM": generateSection75Claim,
  "UK-CHARGEBACK-REQUEST-LETTER": generateChargebackRequest,
  "UK-WARRANTY-CLAIM-LETTER": generateWarrantyClaimLetter,
  "UK-INSURANCE-CLAIM-LETTER": generateInsuranceClaimLetter,
  "UK-CANCELLATION-LETTER": generateCancellationLetter,
  "UK-CEASE-AND-DESIST-LETTER": generateCeaseAndDesistLetter,
};
