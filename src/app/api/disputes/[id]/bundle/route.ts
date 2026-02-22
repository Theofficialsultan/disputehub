/**
 * API Route: Export Case Bundle
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { generateCaseBundle, estimateBundleSize } from "@/lib/pdf/case-bundle";

// GET: Get bundle estimate or download bundle
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseId = params.id;
  const searchParams = request.nextUrl.searchParams;
  const estimate = searchParams.get("estimate") === "true";

  try {
    if (estimate) {
      // Return estimated bundle info
      const estimateData = await estimateBundleSize(caseId, userId);
      return NextResponse.json({ estimate: estimateData });
    }

    // Generate and return the bundle
    const options = {
      includeEvidence: searchParams.get("includeEvidence") !== "false",
      includeCoverPage: searchParams.get("includeCoverPage") !== "false",
      includeTableOfContents: searchParams.get("includeTableOfContents") !== "false",
      includeTimeline: searchParams.get("includeTimeline") !== "false",
      includeStrategy: searchParams.get("includeStrategy") !== "false",
    };

    const bundle = await generateCaseBundle(caseId, userId, options);

    // Return PDF
    return new NextResponse(bundle.pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${bundle.filename}"`,
        "Content-Length": bundle.pdfBuffer.length.toString(),
        "X-Page-Count": bundle.pageCount.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating case bundle:", error);
    return NextResponse.json(
      { error: "Failed to generate case bundle" },
      { status: 500 }
    );
  }
}

// POST: Generate bundle with custom options
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseId = params.id;

  try {
    const body = await request.json();
    const options = {
      includeEvidence: body.includeEvidence ?? true,
      includeCoverPage: body.includeCoverPage ?? true,
      includeTableOfContents: body.includeTableOfContents ?? true,
      includeTimeline: body.includeTimeline ?? true,
      includeStrategy: body.includeStrategy ?? true,
    };

    const bundle = await generateCaseBundle(caseId, userId, options);

    return new NextResponse(bundle.pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${bundle.filename}"`,
        "Content-Length": bundle.pdfBuffer.length.toString(),
        "X-Page-Count": bundle.pageCount.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating case bundle:", error);
    return NextResponse.json(
      { error: "Failed to generate case bundle" },
      { status: 500 }
    );
  }
}
