/**
 * API Route: Legal Glossary
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllTerms,
  getTerm,
  searchTerms,
  getTermsByCategory,
  getRelatedTerms,
  getCategoriesWithCounts,
  type GlossaryCategory,
} from "@/lib/legal/glossary";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const term = searchParams.get("term");
  const search = searchParams.get("search");
  const category = searchParams.get("category") as GlossaryCategory | null;
  const related = searchParams.get("related");

  // Get specific term
  if (term) {
    const result = getTerm(term);
    if (!result) {
      return NextResponse.json(
        { error: "Term not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ term: result });
  }

  // Search terms
  if (search) {
    const results = searchTerms(search);
    return NextResponse.json({ terms: results, count: results.length });
  }

  // Get terms by category
  if (category) {
    const results = getTermsByCategory(category);
    return NextResponse.json({ terms: results, count: results.length });
  }

  // Get related terms
  if (related) {
    const results = getRelatedTerms(related);
    return NextResponse.json({ terms: results, count: results.length });
  }

  // Default: return all terms and categories
  const terms = getAllTerms();
  const categories = getCategoriesWithCounts();

  return NextResponse.json({
    terms,
    categories,
    totalCount: terms.length,
  });
}
