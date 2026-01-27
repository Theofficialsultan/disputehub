/**
 * Phase 8.5 - Evidence Upload API
 * Handles file upload to Supabase Storage and evidence record creation
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { createEvidence } from "@/lib/evidence/service";
import { prisma } from "@/lib/prisma";
import { supabaseStorage } from "@/lib/storage/supabase";
import { analyzeImageEvidence, generateEvidenceTitle } from "@/lib/evidence/vision";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_PDF_TYPE = "application/pdf";
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPE];

export async function POST(request: NextRequest) {
  console.log("[Evidence Upload] API called");
  
  const userId = await getCurrentUserId();

  if (!userId) {
    console.log("[Evidence Upload] No user ID");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  console.log("[Evidence Upload] User ID:", userId);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const evidenceDateStr = formData.get("evidenceDate") as string | null;

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID required" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Title required" },
        { status: 400 }
      );
    }

    // Verify case ownership
    const caseData = await prisma.dispute.findUnique({
      where: { id: caseId },
      select: { userId: true },
    });

    if (!caseData || caseData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and PDF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Determine evidence type
    const fileType = ALLOWED_IMAGE_TYPES.includes(file.type) ? "IMAGE" : "PDF";

    // Create unique file path
    const fileExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const storagePath = `cases/${caseId}/evidence/${timestamp}-${randomString}.${fileExtension}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using client
    console.log("[Evidence Upload] Uploading to Supabase:", storagePath);
    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from("evidence")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Evidence Upload] Supabase upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    console.log("[Evidence Upload] Upload successful:", uploadData);

    // Get public URL
    const { data: publicUrlData } = supabaseStorage.storage
      .from("evidence")
      .getPublicUrl(storagePath);

    const fileUrl = publicUrlData.publicUrl;

    // Parse evidence date
    const evidenceDate = evidenceDateStr ? new Date(evidenceDateStr) : undefined;

    // AI-powered evidence analysis and title generation
    let finalTitle = title;
    let aiDescription = description || undefined;
    let extractedInfo: string[] = [];

    try {
      // Get case context for better analysis
      const caseData = await prisma.dispute.findUnique({
        where: { id: caseId },
        include: {
          caseStrategy: true,
        },
      });

      // For images, use vision AI to analyze and generate title
      if (fileType === "IMAGE") {
        console.log("[Evidence Upload] Analyzing image with Vision AI...");
        const analysis = await analyzeImageEvidence(fileUrl, {
          disputeType: caseData?.caseStrategy?.disputeType || undefined,
          keyFacts: caseData?.caseStrategy?.keyFacts || undefined,
        });

        // Use AI-suggested title if it's better than user's
        finalTitle = analysis.suggestedTitle || title;
        
        // Enhance description with AI analysis
        if (!description && analysis.description) {
          aiDescription = analysis.description;
        } else if (description && analysis.description) {
          aiDescription = `${description}\n\nAI Analysis: ${analysis.description}`;
        }

        // Store extracted text and details
        if (analysis.extractedText) {
          extractedInfo.push(`Extracted Text: ${analysis.extractedText}`);
        }
        if (analysis.relevantDetails.length > 0) {
          extractedInfo.push(`Details: ${analysis.relevantDetails.join(", ")}`);
        }

        console.log("[Evidence Upload] Vision AI analysis complete:", {
          suggestedTitle: finalTitle,
          extractedDetails: extractedInfo.length,
        });
      } else {
        // For PDFs, just generate a professional title
        console.log("[Evidence Upload] Generating professional title...");
        finalTitle = await generateEvidenceTitle(
          title,
          fileType,
          description || undefined,
          evidenceDate
        );
      }
    } catch (aiError) {
      console.error("[Evidence Upload] AI analysis failed, using original title:", aiError);
      // Continue with original title if AI fails
    }

    // Append extracted info to description
    if (extractedInfo.length > 0) {
      const extractedText = extractedInfo.join("\n");
      aiDescription = aiDescription
        ? `${aiDescription}\n\n${extractedText}`
        : extractedText;
    }

    // Create evidence record
    const evidence = await createEvidence({
      caseId,
      userId,
      fileUrl,
      fileType,
      fileName: file.name,
      fileSize: file.size,
      title: finalTitle, // Use AI-generated title
      description: aiDescription,
      evidenceDate,
    });

    return NextResponse.json({
      evidence,
      message: "Evidence uploaded successfully",
    });
  } catch (error) {
    console.error("Evidence upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload evidence";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
