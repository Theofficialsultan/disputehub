/**
 * LEGAL ACCURACY RULES FOR DOCUMENT GENERATION
 * 
 * These rules ensure all generated documents are legally accurate and procedurally correct.
 * System 3 (document generator) MUST follow these rules for all UK legal documents.
 */

export const LEGAL_ACCURACY_RULES = `
═══════════════════════════════════════════════════════════════
CRITICAL LEGAL ACCURACY RULES - MUST FOLLOW
═══════════════════════════════════════════════════════════════

1. LEGAL CHARACTERIZATION - EMPLOYMENT VS SELF-EMPLOYMENT

   ❌ NEVER use "unpaid wages" for self-employed claimants
   ✅ ALWAYS use "unpaid contractual fee" or "debt" for self-employed
   
   Employment indicators:
   - PAYE tax deductions
   - Employee contract
   - Fixed hours/salary
   - Subordination/control
   
   Self-employment indicators:
   - Self-employed status mentioned
   - Invoice-based payment
   - Own equipment/tools
   - Multiple clients
   - IR35/CIS status
   
   ⚠️ If self-employed, frame claim as:
   - "Breach of contract - unpaid contractual fee"
   - "Debt claim for services rendered"
   - NEVER "employment" or "wages"
   
   ❌ FORBIDDEN for self-employed in County Court:
   - "Employment Rights Act 1996"
   - "unlawful deduction from wages"
   - "contract of employment"
   - References to Employment Tribunal jurisdiction
   
   ✅ Use instead:
   - "contract for services"
   - "breach of contract"
   - "debt claim"
   - Common law principles

───────────────────────────────────────────────────────────────

1A. FORUM SELECTION - CRITICAL

   Employment Tribunal (ET1):
   - ONLY for employees/workers
   - Unfair dismissal, discrimination, ERA 1996 claims
   - Requires ACAS early conciliation
   
   County Court (N1):
   - Self-employed/contractors
   - Consumers
   - Contract disputes, debt claims
   - Civil claims not covered by tribunal
   
   ⚠️ NEVER MIX:
   - Don't cite ERA 1996 in County Court for self-employed
   - Don't use "wages" terminology for contractors
   - Don't use Employment Tribunal jurisdiction for non-employees

───────────────────────────────────────────────────────────────

2. CONTRACT FORMATION - MUST BE EXPLICIT

   A proper Particulars of Claim MUST establish contract formation:
   
   ✅ INCLUDE:
   - Express verbal/written agreement
   - Consideration (what each party promised)
   - Acceptance (how agreement was reached)
   - Course of dealing (if applicable - e.g., "regular work relationship")
   - Implied term to pay reasonable remuneration
   - Partial performance doctrine (work done, payment due)
   
   ✅ ALWAYS include fallback basis:
   - "Alternatively, the Claimant claims on a quantum meruit basis"
   - "A reasonable sum for work done and services rendered"
   
   ❌ WEAK: "entered into an agreement whereby..."
   ✅ STRONG: 
      "On [date], the parties entered into an oral/written agreement whereby:
       (a) The Claimant agreed to provide [services]
       (b) The Defendant agreed to pay £X per [hour/day/job]
       (c) This was accepted by [conduct/email/phone call]
       
       Alternatively, the Claimant claims on a quantum meruit basis
       for reasonable remuneration for work done."

───────────────────────────────────────────────────────────────

3. EVIDENCE HANDLING - COURT-STYLE REFERENCING

   ❌ DO NOT embed evidence descriptions in Particulars of Claim
   ❌ DO NOT include:
      - Image descriptions in PoC
      - EXIF metadata
      - Narrative captions
      - Evidence bundle content
   
   ✅ CORRECT approach:
      - Refer to evidence only
      - Use exhibit references
      - Attach as separate exhibits with index
   
   Example in PoC:
   
   "The Claimant will rely on:
    • Photographs taken hourly on 14 October 2025 (Exhibits A1–A6)
    • Email correspondence dated 15 October 2025 (Exhibit B1)
    • Invoice dated 16 October 2025 (Exhibit C1)"
   
   Evidence descriptions go in EVIDENCE BUNDLE, not in PoC.

───────────────────────────────────────────────────────────────

4. INTEREST CLAIMS - STANDARD WORDING

   ✅ Use this wording for interest:
   
   "Interest pursuant to section 69 of the County Courts Act 1984
    at the rate of 8% per annum from [date due] to the date of 
    judgment, or such other rate and period as the court thinks fit."
   
   Include the "or such other rate..." clause for flexibility.

───────────────────────────────────────────────────────────────

5. DOCUMENT LABELING - N1 vs PARTICULARS OF CLAIM

   ⚠️ CRITICAL DISTINCTION:
   
   The N1 Form itself includes:
   - Party details (claimant/defendant names, addresses)
   - Brief details of claim (2-3 sentences)
   - Value of claim
   - Remedy sought
   - Tick boxes for claim type
   
   Particulars of Claim is:
   - A SEPARATE document (or attached to N1)
   - Full narrative of facts
   - Legal basis
   - Evidence references
   - Detailed loss/damage
   
   ✅ Label documents correctly:
   
   "PARTICULARS OF CLAIM
    (Attached to Claim Form N1)"
   
   NOT "N1 FORM" when generating the detailed narrative.

───────────────────────────────────────────────────────────────

6. PROHIBITED PHRASES - AVOID WEAK/INCORRECT LANGUAGE

   ❌ AVOID:
   - "entered into an agreement whereby..." (too weak)
   - "unpaid wages" (for self-employed)
   - "employee" (for self-employed claimant)
   - Evidence descriptions in PoC body
   - Vague contract formation
   
   ✅ USE:
   - Explicit contract formation elements
   - "Unpaid contractual fee/debt" (self-employed)
   - "Worker" or "Self-employed contractor" (accurate status)
   - "Exhibit A1" style evidence references
   - Quantum meruit fallback

───────────────────────────────────────────────────────────────

7. SELF-EMPLOYED CLAIMANT TEMPLATE

   If claimant is self-employed, use this structure:
   
   "PARTICULARS OF CLAIM
   
   1. The Claimant is a self-employed [trade/profession].
   
   2. The Defendant is [company name and type].
   
   3. THE CONTRACT
   
      On or around [date], the parties entered into an oral/written
      contract whereby:
      
      (a) The Claimant agreed to provide [specific services]
      (b) The Defendant agreed to pay £X per [unit]
      (c) This was agreed by [phone call/email/conduct]
      
      Alternatively, there was an implied contract arising from:
      - The Defendant's request for services
      - The Claimant's provision of those services
      - A course of dealing between the parties
      - An implied term that the Claimant would be paid reasonable
        remuneration for work done
   
   4. PERFORMANCE
   
      On [date], the Claimant performed the contracted services:
      [List specific work done]
   
   5. BREACH
   
      Despite repeated requests, the Defendant has failed to pay
      the contractual fee of £X due on [date].
   
   6. QUANTUM MERUIT (ALTERNATIVE)
   
      If the Court finds no express contract, the Claimant claims
      on a quantum meruit basis a reasonable sum for work done,
      being £X.
   
   7. LOSS
   
      The Claimant has suffered loss of £X, being the unpaid
      contractual fee/debt.
   
   8. INTEREST
   
      Interest pursuant to s.69 County Courts Act 1984 at 8% p.a.
      from [date] to judgment, or such other rate as the court
      thinks fit.
   
   AND THE CLAIMANT CLAIMS:
   
   (1) £X (unpaid contractual fee)
   (2) Interest as above
   (3) Costs"

───────────────────────────────────────────────────────────────

8. DEFENDANT NAMING - LEGAL ENTITY FORMAT

   ⚠️ CRITICAL: Never mix entity types
   
   LIMITED COMPANY:
   ✅ "ABC LIMITED" or "ABC LTD"
   ❌ "John Smith (t/a ABC LTD)" - WRONG!
   
   SOLE TRADER:
   ✅ "JOHN SMITH trading as ABC SERVICES"
   ✅ "JOHN SMITH t/a ABC SERVICES"
   ❌ "ABC SERVICES" alone if it's not a registered company
   
   Determination rules:
   - If name contains "LTD", "LIMITED", "PLC" → company is defendant
   - If sole trader → person's full name is defendant
   - Trading name is additional info, not substitute
   
   Check Companies House if unsure about entity type.

───────────────────────────────────────────────────────────────

9. AMOUNT CONSISTENCY - MATH MUST ADD UP

   ⚠️ The amount claimed MUST match the facts stated
   
   ❌ INCONSISTENT:
   "Worked 11.5 hours... waived final hour... claims £145 (full shift)"
   
   ✅ CONSISTENT:
   "Worked 11 hours at £12.60/hour... claims £138.60"
   
   Rules:
   - If partial work, claim partial amount
   - If waived some work, explain or reduce claim
   - Show calculation: hours × rate = amount
   - Any discrepancy WILL be attacked by defence

───────────────────────────────────────────────────────────────

10. COSTS IN SMALL CLAIMS TRACK

   UK claim tracks:
   - Small claims: up to £10,000
   - Fast track: £10,001 - £25,000
   - Multi-track: £25,001+
   
   Small claims track (most debt claims):
   ❌ Cannot claim legal costs
   ❌ Cannot claim solicitor fees
   ✅ Can claim: court fees, witness expenses, limited fixed costs
   
   ✅ Correct wording for small claims:
   "(3) Fixed costs and court fees as allowed by the court"
   
   ❌ Wrong for small claims:
   "(3) Costs" (implies full legal costs)

───────────────────────────────────────────────────────────────

11. INTEREST START DATE

   Interest should run from the day AFTER payment was due:
   
   ✅ "from 15 October 2025" (if payment due 14 October)
   ❌ "from 14 October 2025" (if that was the work date, not payment due date)
   
   Unless contract says "payment due same day", use day after.

═══════════════════════════════════════════════════════════════
END OF LEGAL ACCURACY RULES
═══════════════════════════════════════════════════════════════
`;

/**
 * Determine employment status from case facts
 */
export function determineEmploymentStatus(facts: string[]): "employed" | "self-employed" | "worker" | "unknown" {
  const factsText = facts.join(" ").toLowerCase();
  
  // Self-employment indicators
  if (
    factsText.includes("self-employed") ||
    factsText.includes("self employed") ||
    factsText.includes("contractor") ||
    factsText.includes("invoice") ||
    factsText.includes("freelance") ||
    factsText.includes("ir35") ||
    factsText.includes("cis")
  ) {
    return "self-employed";
  }
  
  // Employment indicators
  if (
    factsText.includes("employee") ||
    factsText.includes("paye") ||
    factsText.includes("employed by") ||
    factsText.includes("salary") ||
    factsText.includes("contract of employment")
  ) {
    return "employed";
  }
  
  // Worker status (hybrid)
  if (factsText.includes("worker") || factsText.includes("casual")) {
    return "worker";
  }
  
  return "unknown";
}

/**
 * Get correct terminology for unpaid money based on employment status
 */
export function getUnpaidMoneyTerminology(status: "employed" | "self-employed" | "worker" | "unknown"): {
  term: string;
  claimType: string;
} {
  switch (status) {
    case "self-employed":
      return {
        term: "unpaid contractual fee",
        claimType: "Breach of contract - unpaid contractual fee / debt claim"
      };
    case "employed":
      return {
        term: "unpaid wages",
        claimType: "Breach of contract - unpaid wages"
      };
    case "worker":
      return {
        term: "unpaid remuneration",
        claimType: "Breach of contract - unpaid remuneration"
      };
    default:
      return {
        term: "unpaid sum",
        claimType: "Breach of contract - unpaid sum due"
      };
  }
}
