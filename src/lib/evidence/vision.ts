/**
 * Evidence Vision AI Service
 * Analyzes images and generates court-appropriate evidence titles
 */

import { openai } from "@/lib/ai/openai";

/**
 * Analyze an image and extract relevant information
 * @param imageUrl - Public URL of the image to analyze
 * @param context - Optional context about the case
 * @returns Extracted information from the image
 */
export async function analyzeImageEvidence(
  imageUrl: string,
  context?: {
    disputeType?: string;
    keyFacts?: string[];
  }
): Promise<{
  description: string;
  suggestedTitle: string;
  extractedText?: string;
  relevantDetails: string[];
}> {
  try {
    const contextPrompt = context
      ? `\n\nCase Context:\n- Dispute Type: ${context.disputeType || "Unknown"}\n- Key Facts: ${context.keyFacts?.join(", ") || "None provided"}`
      : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Vision-capable model
      messages: [
        {
          role: "system",
          content: `You are a legal evidence analyst. Analyze images and extract relevant information for legal cases.

Your task:
1. Describe what you see in the image
2. Extract any visible text (emails, messages, documents, timestamps, names, amounts)
3. Identify relevant details for a legal dispute
4. Suggest a professional, court-appropriate title for this evidence

Format your response as JSON:
{
  "description": "Clear description of the image",
  "suggestedTitle": "Professional title suitable for court documents",
  "extractedText": "Any text visible in the image",
  "relevantDetails": ["detail 1", "detail 2", "detail 3"]
}

Guidelines for titles:
- Be specific and factual
- Include dates if visible
- Include parties/names if visible
- Use formal language
- Examples: "Email from Employer dated 14/10/2025", "Photograph of Work Site showing Presence", "Screenshot of Payment Request"`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this evidence image and provide a detailed analysis.${contextPrompt}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      temperature: 0.3, // Lower temperature for factual analysis
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("Empty response from vision AI");
    }

    const analysis = JSON.parse(response);

    return {
      description: analysis.description || "Image evidence",
      suggestedTitle: analysis.suggestedTitle || "Evidence Item",
      extractedText: analysis.extractedText,
      relevantDetails: analysis.relevantDetails || [],
    };
  } catch (error) {
    console.error("[Vision AI] Error analyzing image:", error);
    throw new Error("Failed to analyze image evidence");
  }
}

/**
 * Generate a court-appropriate title for evidence
 * @param originalTitle - Original user-provided title
 * @param fileType - Type of file (IMAGE or PDF)
 * @param description - Optional description
 * @param evidenceDate - Optional date
 * @returns Professional evidence title
 */
export async function generateEvidenceTitle(
  originalTitle: string,
  fileType: "IMAGE" | "PDF",
  description?: string,
  evidenceDate?: Date
): Promise<string> {
  try {
    const dateStr = evidenceDate
      ? evidenceDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : null;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal document specialist. Generate professional, court-appropriate titles for evidence items.

Guidelines:
- Be specific and factual
- Include dates if provided
- Use formal language
- Keep it concise (max 60 characters)
- Examples: "Email from Employer dated 14/10/2025", "Photograph of Work Site", "Payment Receipt for £145"

Return ONLY the title, nothing else.`,
        },
        {
          role: "user",
          content: `Generate a professional evidence title for:
- Original title: ${originalTitle}
- File type: ${fileType === "IMAGE" ? "Photograph/Screenshot" : "PDF Document"}
${description ? `- Description: ${description}` : ""}
${dateStr ? `- Date: ${dateStr}` : ""}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const title = completion.choices[0]?.message?.content?.trim();

    if (!title) {
      return originalTitle; // Fallback to original
    }

    return title;
  } catch (error) {
    console.error("[Vision AI] Error generating title:", error);
    return originalTitle; // Fallback to original
  }
}
