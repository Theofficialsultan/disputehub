/**
 * TIER 2: COMPLEX / ADR TEMPLATES
 * Pre-Action & Alternative Resolution - before court
 */

import type { FormTemplateContext } from "./form-templates-full";
import { formatUserDetails } from "./form-templates-full";

// ============================================================================
// SUBJECT ACCESS REQUEST (GDPR)
// ============================================================================

export function generateSubjectAccessRequest(ctx: FormTemplateContext): string {
  const { today, strategy, user } = ctx;
  const counterparty = (strategy as any).counterpartyName || "[Organisation Name]";
  
  // Format user details
  const { fullName, fullAddress } = formatUserDetails(user);
  
  return `
═══════════════════════════════════════════════════════════════════════════════
SUBJECT ACCESS REQUEST
Under Article 15 of the UK General Data Protection Regulation (UK GDPR)
and Section 45 of the Data Protection Act 2018
═══════════════════════════════════════════════════════════════════════════════

${fullName}
${fullAddress}
${user.email || '[YOUR EMAIL]'}
${user.phone || '[YOUR PHONE]'}

${counterparty}
[Data Protection Officer / Privacy Team]
[ADDRESS]

Date: ${today}

Dear Data Protection Officer,

RE: SUBJECT ACCESS REQUEST (SAR)

I am making a formal Subject Access Request under Article 15 of the UK GDPR.

───────────────────────────────────────────────────────────────────────────────
MY IDENTITY
───────────────────────────────────────────────────────────────────────────────

Full name: [YOUR FULL NAME]
Date of birth: [DD/MM/YYYY]
Address: [YOUR ADDRESS]

Previous addresses (if applicable):
• [Address 1 - dates]
• [Address 2 - dates]

Account/Customer reference numbers (if known):
• [Reference 1]
• [Reference 2]

───────────────────────────────────────────────────────────────────────────────
IDENTITY VERIFICATION
───────────────────────────────────────────────────────────────────────────────

I enclose the following to verify my identity:

☐ Copy of passport
☐ Copy of driving licence
☐ Copy of utility bill (within last 3 months)
☐ Copy of bank statement (within last 3 months)

[Select and enclose at least one photo ID and one proof of address]

───────────────────────────────────────────────────────────────────────────────
INFORMATION REQUESTED
───────────────────────────────────────────────────────────────────────────────

Under Article 15 of the UK GDPR, I am entitled to receive:

1. CONFIRMATION of whether you are processing my personal data

2. A COPY of all personal data you hold about me, including but not limited to:
   • Name, address, contact details
   • Account information and transaction history
   • Communications (emails, letters, call recordings, chat logs)
   • Notes, comments, or opinions about me
   • CCTV footage (if applicable)
   • Any data obtained from third parties
   • Marketing preferences and profiling data
   • Complaint records

3. INFORMATION about:
   • The purposes of processing
   • The categories of personal data concerned
   • The recipients to whom data has been disclosed
   • The retention period for the data
   • The source of the data (if not collected from me)
   • Whether automated decision-making/profiling is used
   • Safeguards for international transfers (if applicable)

4. SPECIFIC DATA (if applicable):
   [Add any specific data you are particularly interested in, e.g.:]
   • All internal emails mentioning my name
   • All CCTV footage from [date] at [location]
   • My employment file and all HR records
   • All telephone call recordings

───────────────────────────────────────────────────────────────────────────────
TIME LIMIT FOR RESPONSE
───────────────────────────────────────────────────────────────────────────────

Under Article 12 of the UK GDPR, you must respond to this request within ONE CALENDAR MONTH of receipt.

If you believe you need an extension (up to a maximum of two further months), you must:
• Inform me within one month of receipt
• Explain why the extension is necessary

───────────────────────────────────────────────────────────────────────────────
FORMAT OF RESPONSE
───────────────────────────────────────────────────────────────────────────────

Please provide the information in:
☐ Electronic format (via email or secure download) - PREFERRED
☐ Paper format (posted to my address above)

If providing electronically, please send to: [YOUR EMAIL]

───────────────────────────────────────────────────────────────────────────────
FEES
───────────────────────────────────────────────────────────────────────────────

Under the UK GDPR, this request is FREE OF CHARGE. You may only charge a reasonable fee if:
• The request is manifestly unfounded or excessive
• I request additional copies beyond the first copy

If you intend to charge a fee or refuse this request, you must explain why.

───────────────────────────────────────────────────────────────────────────────
NON-COMPLIANCE
───────────────────────────────────────────────────────────────────────────────

If you fail to respond within the statutory timeframe or provide an inadequate response, I will:

1. Lodge a complaint with the Information Commissioner's Office (ICO)
2. Consider court action under Section 167 of the Data Protection Act 2018

I look forward to your response within one month.

Yours faithfully,

_______________________
[YOUR SIGNATURE]
[YOUR NAME]

Enclosures:
• Copy of ID
• Proof of address

═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

// ============================================================================
// FREEDOM OF INFORMATION REQUEST
// ============================================================================

export function generateFOIRequest(ctx: FormTemplateContext): string {
  const { today, strategy } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Public Authority Name]";
  
  return `
[YOUR NAME]
[YOUR ADDRESS]
[YOUR EMAIL]

${counterparty}
[FOI/Information Request Team]
[ADDRESS]

Date: ${today}

Dear Sir/Madam,

RE: FREEDOM OF INFORMATION REQUEST
Under the Freedom of Information Act 2000

I am writing to make a request for information under the Freedom of Information Act 2000.

───────────────────────────────────────────────────────────────────────────────
INFORMATION REQUESTED
───────────────────────────────────────────────────────────────────────────────

Please provide me with the following information:

${facts.length > 0 ? facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n') : `1. [Describe the information you want clearly and specifically]

2. [Be as precise as possible about dates, names, documents]

3. [The more specific your request, the more likely you are to get a useful response]`}

───────────────────────────────────────────────────────────────────────────────
FORMAT
───────────────────────────────────────────────────────────────────────────────

Please provide the information in [electronic format / paper copies / both].

If possible, please send to: [YOUR EMAIL]

───────────────────────────────────────────────────────────────────────────────
TIMEFRAME
───────────────────────────────────────────────────────────────────────────────

Under Section 10 of the Freedom of Information Act 2000, you are required to respond within 20 working days of receiving this request.

If you need clarification about this request, please contact me as soon as possible.

───────────────────────────────────────────────────────────────────────────────
FEES
───────────────────────────────────────────────────────────────────────────────

I understand that FOI requests are generally free, but fees may apply if the cost of responding exceeds the "appropriate limit" (currently £450 for central government, £600 for other authorities).

If you believe this request exceeds the cost limit, please contact me to discuss narrowing the scope.

───────────────────────────────────────────────────────────────────────────────
EXEMPTIONS
───────────────────────────────────────────────────────────────────────────────

If you wish to apply any exemptions under the Act, please:
• Specify which exemption(s) you are relying on
• Explain why the exemption applies
• Consider whether the public interest favours disclosure

If information is being withheld, please confirm whether the information exists.

───────────────────────────────────────────────────────────────────────────────
REVIEW RIGHTS
───────────────────────────────────────────────────────────────────────────────

I am aware that if I am dissatisfied with your response, I can request an internal review and subsequently complain to the Information Commissioner's Office.

I look forward to your response.

Yours faithfully,

_______________________
[YOUR NAME]
`.trim();
}

// ============================================================================
// ICO COMPLAINT (Data Protection)
// ============================================================================

export function generateICOComplaint(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Organisation Name]";
  
  return `
═══════════════════════════════════════════════════════════════════════════════
COMPLAINT TO THE INFORMATION COMMISSIONER'S OFFICE
Data Protection Complaint
═══════════════════════════════════════════════════════════════════════════════

To: Information Commissioner's Office
    Wycliffe House
    Water Lane
    Wilmslow
    Cheshire
    SK9 5AF

    Or submit online: https://ico.org.uk/make-a-complaint/

Date: ${today}

───────────────────────────────────────────────────────────────────────────────
YOUR DETAILS
───────────────────────────────────────────────────────────────────────────────

Name: [YOUR FULL NAME]
Address: [YOUR ADDRESS]
Email: [YOUR EMAIL]
Phone: [YOUR PHONE]

───────────────────────────────────────────────────────────────────────────────
ORGANISATION YOU ARE COMPLAINING ABOUT
───────────────────────────────────────────────────────────────────────────────

Organisation name: ${counterparty}
Address: [ORGANISATION ADDRESS]
Website: [ORGANISATION WEBSITE]
Reference number (if any): [ACCOUNT/CUSTOMER NUMBER]

───────────────────────────────────────────────────────────────────────────────
NATURE OF COMPLAINT
───────────────────────────────────────────────────────────────────────────────

My complaint concerns (tick all that apply):

☐ Subject Access Request not responded to / incomplete response
☐ Personal data processed without consent
☐ Personal data is inaccurate and organisation refuses to correct
☐ Personal data shared without lawful basis
☐ Data breach - my personal data has been disclosed
☐ Excessive data collection
☐ Refusal to delete data (right to erasure)
☐ Marketing without consent (calls, emails, texts)
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
WHAT HAPPENED
───────────────────────────────────────────────────────────────────────────────

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

Date(s) of incident: [DATES]

───────────────────────────────────────────────────────────────────────────────
STEPS ALREADY TAKEN
───────────────────────────────────────────────────────────────────────────────

Before complaining to the ICO, you should have raised the matter with the organisation directly.

1. Date I first contacted the organisation: [DATE]
2. How I contacted them: [Email/Letter/Phone/Online form]
3. Their response (if any): [Summary of response]
4. Date of their final response: [DATE] (or "No response received")
5. Why I am dissatisfied: [Explain]

[IMPORTANT: The ICO usually expects you to have given the organisation at least 
28 days to respond to your complaint before escalating to them]

───────────────────────────────────────────────────────────────────────────────
EVIDENCE ENCLOSED
───────────────────────────────────────────────────────────────────────────────

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : `1. Copy of my Subject Access Request (if applicable)
2. Correspondence with the organisation
3. Their response (or evidence of no response)
4. Any other relevant documents`}

───────────────────────────────────────────────────────────────────────────────
WHAT I WANT TO HAPPEN
───────────────────────────────────────────────────────────────────────────────

I would like the ICO to:

☐ Investigate my complaint
☐ Require the organisation to respond to my SAR
☐ Require the organisation to correct/delete my data
☐ Take enforcement action if appropriate
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
DECLARATION
───────────────────────────────────────────────────────────────────────────────

I confirm that the information I have provided is accurate to the best of my knowledge.

Signed: _______________________  Date: ${today}

Name: [YOUR NAME]

═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

// ============================================================================
// LOCAL GOVERNMENT & SOCIAL CARE OMBUDSMAN (LGSCO)
// ============================================================================

export function generateLGSCOComplaint(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Council/Authority Name]";
  
  return `
═══════════════════════════════════════════════════════════════════════════════
COMPLAINT TO LOCAL GOVERNMENT & SOCIAL CARE OMBUDSMAN
═══════════════════════════════════════════════════════════════════════════════

To: Local Government and Social Care Ombudsman
    PO Box 4771
    Coventry
    CV4 0EH

    Or submit online: https://www.lgo.org.uk/make-a-complaint

Date: ${today}

───────────────────────────────────────────────────────────────────────────────
YOUR DETAILS
───────────────────────────────────────────────────────────────────────────────

Name: [YOUR FULL NAME]
Address: [YOUR ADDRESS]
Email: [YOUR EMAIL]
Phone: [YOUR PHONE]

Are you complaining on someone else's behalf?
☐ No, this is my complaint
☐ Yes, I have their written consent (enclosed)

───────────────────────────────────────────────────────────────────────────────
ORGANISATION YOU ARE COMPLAINING ABOUT
───────────────────────────────────────────────────────────────────────────────

Name: ${counterparty}
Type: ☐ Local Council  ☐ Care Provider  ☐ School Admissions  ☐ Other: _______
Address: [ADDRESS]
Reference number: [CASE/ACCOUNT NUMBER if applicable]

───────────────────────────────────────────────────────────────────────────────
HAVE YOU COMPLAINED TO THE ORGANISATION FIRST?
───────────────────────────────────────────────────────────────────────────────

The Ombudsman can only investigate if you have first complained to the organisation 
and received their final response, OR they have had 12 weeks to respond.

Date I first complained: [DATE]
Date of their final response: [DATE / "No response received"]

☐ I have completed the organisation's complaints procedure
☐ The organisation has not responded after more than 12 weeks
☐ I am being asked to provide information I cannot get

[IMPORTANT: Enclose a copy of the final response or evidence of your complaint]

───────────────────────────────────────────────────────────────────────────────
WHAT IS YOUR COMPLAINT ABOUT?
───────────────────────────────────────────────────────────────────────────────

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

───────────────────────────────────────────────────────────────────────────────
WHAT WENT WRONG (MALADMINISTRATION)
───────────────────────────────────────────────────────────────────────────────

The organisation's fault was (tick all that apply):

☐ Delay in dealing with my case
☐ Failure to follow proper procedures
☐ Failure to provide information
☐ Gave incorrect advice or information
☐ Discriminatory treatment
☐ Failure to provide a service they should have
☐ Unfair treatment compared to others
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
HOW HAS THIS AFFECTED YOU? (INJUSTICE)
───────────────────────────────────────────────────────────────────────────────

As a result of the organisation's fault, I have suffered:

☐ Financial loss: £_______
☐ Time and trouble pursuing the complaint
☐ Distress and anxiety
☐ Loss of service/benefit
☐ Physical impact (health)
☐ Other: _______________________

Please describe the impact:

[Explain how you have been personally affected]

───────────────────────────────────────────────────────────────────────────────
WHAT DO YOU WANT TO PUT THINGS RIGHT?
───────────────────────────────────────────────────────────────────────────────

☐ An apology
☐ Financial compensation: £_______
☐ The service I should have received
☐ Change in the organisation's policy/procedures
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
EVIDENCE ENCLOSED
───────────────────────────────────────────────────────────────────────────────

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : `1. Organisation's final complaint response
2. My original complaint to the organisation
3. Relevant correspondence
4. Evidence of loss/impact`}

───────────────────────────────────────────────────────────────────────────────
DECLARATION
───────────────────────────────────────────────────────────────────────────────

I confirm that:
• The information I have given is true and accurate
• I have tried to resolve this with the organisation first

Signed: _______________________  Date: ${today}

Name: [YOUR NAME]

═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

// ============================================================================
// PARLIAMENTARY & HEALTH SERVICE OMBUDSMAN (PHSO)
// ============================================================================

export function generatePHSOComplaint(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[NHS Trust/Government Department]";
  
  return `
═══════════════════════════════════════════════════════════════════════════════
COMPLAINT TO PARLIAMENTARY AND HEALTH SERVICE OMBUDSMAN
═══════════════════════════════════════════════════════════════════════════════

To: Parliamentary and Health Service Ombudsman
    Millbank Tower
    Millbank
    London
    SW1P 4QP

    Or submit online: https://www.ombudsman.org.uk/making-complaint

Date: ${today}

───────────────────────────────────────────────────────────────────────────────
YOUR DETAILS
───────────────────────────────────────────────────────────────────────────────

Name: [YOUR FULL NAME]
Address: [YOUR ADDRESS]
Email: [YOUR EMAIL]
Phone: [YOUR PHONE]

If complaining about NHS care, are you the patient?
☐ Yes
☐ No - I am complaining on behalf of: [Name and relationship]
     ☐ Consent form enclosed

───────────────────────────────────────────────────────────────────────────────
WHICH ORGANISATION ARE YOU COMPLAINING ABOUT?
───────────────────────────────────────────────────────────────────────────────

Name: ${counterparty}
Type: 
☐ NHS Trust / Hospital
☐ GP Practice
☐ NHS England
☐ Government Department (specify): _______
☐ Other public body: _______

Address: [ADDRESS]
Reference/NHS number: [NUMBER if applicable]

───────────────────────────────────────────────────────────────────────────────
HAVE YOU COMPLAINED TO THE ORGANISATION FIRST?
───────────────────────────────────────────────────────────────────────────────

The Ombudsman can only investigate if you have already complained directly and 
either received a final response OR waited at least 6 months (NHS) / 12 weeks (government).

Date of original complaint: [DATE]
Date of final response: [DATE / "No response received"]

☐ I have completed the NHS complaints procedure
☐ I have received a final response from the government department
☐ I have been waiting more than [6 months / 12 weeks] without a final response

[Enclose a copy of the final response]

───────────────────────────────────────────────────────────────────────────────
WHAT IS YOUR COMPLAINT ABOUT?
───────────────────────────────────────────────────────────────────────────────

Date(s) of events: [FROM - TO]

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

───────────────────────────────────────────────────────────────────────────────
WHAT WENT WRONG?
───────────────────────────────────────────────────────────────────────────────

☐ Poor clinical care / treatment
☐ Misdiagnosis / delayed diagnosis
☐ Poor communication
☐ Administrative errors
☐ Delay in providing services
☐ Failure to follow procedures
☐ Incorrect information given
☐ Complaint not handled properly
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
HOW HAS THIS AFFECTED YOU?
───────────────────────────────────────────────────────────────────────────────

☐ Physical harm / worsening of condition
☐ Emotional distress
☐ Financial loss: £_______
☐ Time and trouble
☐ Loss of opportunity
☐ Other: _______________________

Please explain:

[Describe the impact on you or the patient]

───────────────────────────────────────────────────────────────────────────────
WHAT WOULD PUT THINGS RIGHT?
───────────────────────────────────────────────────────────────────────────────

☐ Acknowledgment of what went wrong
☐ Apology
☐ Explanation of what happened
☐ Financial compensation: £_______
☐ Changes to prevent this happening again
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
DOCUMENTS ENCLOSED
───────────────────────────────────────────────────────────────────────────────

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : `1. Final complaint response from organisation
2. My complaint correspondence
3. Medical records (if applicable)
4. Evidence of impact`}

Signed: _______________________  Date: ${today}

Name: [YOUR NAME]

═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

// ============================================================================
// ENERGY OMBUDSMAN COMPLAINT
// ============================================================================

export function generateEnergyOmbudsmanComplaint(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Energy Supplier Name]";
  const amount = (strategy as any).amount || "[Amount]";
  
  return `
═══════════════════════════════════════════════════════════════════════════════
COMPLAINT TO THE ENERGY OMBUDSMAN
═══════════════════════════════════════════════════════════════════════════════

Submit online: https://www.energyombudsman.org/
Or by post: Energy Ombudsman, PO Box 966, Warrington, WA4 9DF

Date: ${today}

───────────────────────────────────────────────────────────────────────────────
YOUR DETAILS
───────────────────────────────────────────────────────────────────────────────

Name: [YOUR FULL NAME]
Address (where energy is supplied): [SUPPLY ADDRESS]
Contact address (if different): [CONTACT ADDRESS]
Email: [YOUR EMAIL]
Phone: [YOUR PHONE]

───────────────────────────────────────────────────────────────────────────────
ENERGY SUPPLIER DETAILS
───────────────────────────────────────────────────────────────────────────────

Supplier name: ${counterparty}
Account number: [ACCOUNT NUMBER]
Fuel type: ☐ Electricity  ☐ Gas  ☐ Both
Meter type: ☐ Credit  ☐ Prepayment  ☐ Smart

───────────────────────────────────────────────────────────────────────────────
HAVE YOU COMPLAINED TO YOUR SUPPLIER FIRST?
───────────────────────────────────────────────────────────────────────────────

The Energy Ombudsman can only help if:
• You have already complained to your supplier AND
• Either 8 weeks have passed OR you have a "deadlock letter"

Date of original complaint: [DATE]
☐ I have received a deadlock letter (date: ______)
☐ 8 weeks have passed since my complaint

[Enclose your deadlock letter or evidence of your complaint]

───────────────────────────────────────────────────────────────────────────────
WHAT IS YOUR COMPLAINT ABOUT?
───────────────────────────────────────────────────────────────────────────────

☐ Billing - incorrect bill amount
☐ Billing - estimated vs actual readings
☐ Billing - back-billing (bill for usage more than 12 months ago)
☐ Switching problems
☐ Smart meter issues
☐ Customer service
☐ Debt collection / enforcement
☐ Prepayment meter issues
☐ Feed-in tariff / export payments
☐ Mis-selling
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
DETAILS OF YOUR COMPLAINT
───────────────────────────────────────────────────────────────────────────────

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

Financial impact: £${amount}

───────────────────────────────────────────────────────────────────────────────
WHAT WOULD RESOLVE THIS FOR YOU?
───────────────────────────────────────────────────────────────────────────────

☐ Bill adjusted / corrected to £_______
☐ Refund of £_______
☐ Compensation for distress/inconvenience: £_______
☐ Apology
☐ Change to my account (specify): _______
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
EVIDENCE ENCLOSED
───────────────────────────────────────────────────────────────────────────────

${evidence.length > 0 ? evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n') : `1. Copy of disputed bill(s)
2. Deadlock letter or complaint correspondence
3. Meter readings
4. Previous bills for comparison`}

Signed: _______________________  Date: ${today}

Name: [YOUR NAME]

═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

// ============================================================================
// INTERNAL APPEAL LETTER
// ============================================================================

export function generateInternalAppealLetter(ctx: FormTemplateContext): string {
  const { today, strategy, evidence } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Organisation/Company Name]";
  
  return `
[YOUR NAME]
[YOUR ADDRESS]
[YOUR EMAIL]

${counterparty}
[Appeals Department / Senior Management]
[ADDRESS]

Date: ${today}

Dear Sir/Madam,

RE: FORMAL APPEAL
Reference: [DECISION/CASE REFERENCE NUMBER]
Date of original decision: [DATE]

I am writing to formally appeal the decision made on [DATE] regarding [brief description].

───────────────────────────────────────────────────────────────────────────────
THE ORIGINAL DECISION
───────────────────────────────────────────────────────────────────────────────

On [DATE], you decided to:

[Describe what was decided - e.g., reject my application, terminate my service, 
uphold a penalty, deny my claim]

This decision was communicated by: [Letter/Email/Phone] dated [DATE]
Reference number: [REFERENCE]

───────────────────────────────────────────────────────────────────────────────
GROUNDS FOR APPEAL
───────────────────────────────────────────────────────────────────────────────

I appeal this decision on the following grounds:

${facts.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

───────────────────────────────────────────────────────────────────────────────
WHY THE ORIGINAL DECISION WAS WRONG
───────────────────────────────────────────────────────────────────────────────

☐ Relevant information was not considered
☐ The decision was based on incorrect facts
☐ Proper procedures were not followed
☐ The decision is inconsistent with similar cases
☐ New evidence has come to light
☐ The decision is disproportionate
☐ Other: _______________________

[Explain in detail]

───────────────────────────────────────────────────────────────────────────────
NEW OR ADDITIONAL EVIDENCE
───────────────────────────────────────────────────────────────────────────────

${evidence.length > 0 ? `I enclose the following evidence in support of my appeal:\n\n${evidence.map((e, i) => `${i + 1}. ${e.title || e.fileName}`).join('\n')}` : `I can provide the following evidence if required:

1. [List documents/evidence you can provide]`}

───────────────────────────────────────────────────────────────────────────────
WHAT I AM ASKING FOR
───────────────────────────────────────────────────────────────────────────────

I request that you:

☐ Overturn the original decision
☐ Reconsider the decision in light of [new evidence / correct facts]
☐ Reduce/waive the penalty/charge
☐ Provide a fair hearing
☐ Other: _______________________

───────────────────────────────────────────────────────────────────────────────
RESPONSE REQUESTED
───────────────────────────────────────────────────────────────────────────────

Please acknowledge receipt of this appeal within 7 days and provide a full 
response within [your complaints procedure timeframe / 28 days].

If I do not receive a satisfactory response, I will escalate this matter to 
[relevant ombudsman/regulator].

Yours faithfully,

_______________________
[YOUR NAME]
`.trim();
}

// ============================================================================
// MEDIATION REQUEST LETTER
// ============================================================================

export function generateMediationRequestLetter(ctx: FormTemplateContext): string {
  const { today, strategy } = ctx;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const counterparty = (strategy as any).counterpartyName || "[Other Party Name]";
  const amount = (strategy as any).amount || "[Amount in dispute]";
  
  return `
[YOUR NAME]
[YOUR ADDRESS]
[YOUR EMAIL]

${counterparty}
[ADDRESS]

Date: ${today}

WITHOUT PREJUDICE

Dear ${counterparty},

RE: PROPOSAL FOR MEDIATION
Dispute concerning: [BRIEF DESCRIPTION]
Value: £${amount}

I am writing to propose that we attempt to resolve our dispute through mediation 
before resorting to court proceedings.

───────────────────────────────────────────────────────────────────────────────
THE DISPUTE
───────────────────────────────────────────────────────────────────────────────

This dispute arises from:

${facts.slice(0, 5).map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

───────────────────────────────────────────────────────────────────────────────
WHY MEDIATION?
───────────────────────────────────────────────────────────────────────────────

Mediation offers several advantages over litigation:

• Cost-effective - significantly cheaper than court proceedings
• Quick - can be arranged within weeks rather than months/years
• Confidential - discussions are private and without prejudice
• Flexible - solutions can be creative and tailored to both parties
• Preserves relationships - less adversarial than court
• High success rate - approximately 70-80% of mediations settle

The courts actively encourage mediation, and unreasonable refusal to mediate 
may result in costs sanctions (Halsey v Milton Keynes General NHS Trust [2004]).

───────────────────────────────────────────────────────────────────────────────
PROPOSED MEDIATION ARRANGEMENT
───────────────────────────────────────────────────────────────────────────────

I propose:

Mediation provider (options):
• Centre for Effective Dispute Resolution (CEDR)
• Civil Mediation Council accredited mediator
• Small Claims Mediation Service (if under £10,000)
• [Other local mediation service]

Suggested timeframe: Within the next [4-6] weeks

Cost sharing: 
☐ Each party pays own share (typically 50/50)
☐ To be agreed

Format:
☐ In-person mediation
☐ Online/telephone mediation (if parties agree)

Duration: [Half day / Full day]

───────────────────────────────────────────────────────────────────────────────
NEXT STEPS
───────────────────────────────────────────────────────────────────────────────

If you are agreeable to mediation, please:

1. Confirm your agreement in writing within 14 days
2. Suggest any alternative mediation providers you would prefer
3. Provide your availability for the next 6 weeks

If I do not hear from you within 14 days, I will assume you have declined 
to mediate and will proceed with issuing court proceedings. I will bring 
this letter to the court's attention regarding costs.

I hope we can resolve this matter amicably.

Yours sincerely,

_______________________
[YOUR NAME]

cc: [Solicitor, if applicable]
`.trim();
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const TIER_2_TEMPLATES: Record<string, (ctx: FormTemplateContext) => string> = {
  "UK-SAR-GDPR-REQUEST": generateSubjectAccessRequest,
  "UK-FOI-REQUEST-LETTER": generateFOIRequest,
  "UK-ICO-COMPLAINT-FORM": generateICOComplaint,
  "UK-LGSCO-LOCAL-GOV-OMBUDSMAN": generateLGSCOComplaint,
  "UK-PHSO-PARLIAMENTARY-HEALTH-OMBUDSMAN": generatePHSOComplaint,
  "UK-ENERGY-OMBUDSMAN-COMPLAINT": generateEnergyOmbudsmanComplaint,
  "UK-INTERNAL-APPEAL-LETTER": generateInternalAppealLetter,
  "UK-MEDIATION-REQUEST-LETTER": generateMediationRequestLetter,
};
