/**
 * xAI Grok API Client
 * 
 * Integration with xAI's Grok models for immigration document generation.
 * Grok-2 is specifically designed for complex reasoning and legal documents.
 */

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokCompletionParams {
  model: "grok-2" | "grok-2-mini";
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface GrokCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate completion using xAI Grok API
 */
export async function generateWithGrok(
  prompt: string,
  config: {
    model?: "grok-2" | "grok-2-mini";
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  
  const apiKey = process.env.XAI_API_KEY;
  
  if (!apiKey || apiKey === "your_xai_api_key_here") {
    throw new Error("XAI_API_KEY not configured. Please add your xAI API key to .env");
  }
  
  const params: GrokCompletionParams = {
    model: config.model || "grok-2",
    messages: [
      {
        role: "system",
        content: "You are an expert UK immigration law specialist and document writer. You understand UK Visas and Immigration (UKVI) procedures, Home Office policies, immigration rules, and tribunal processes. Generate precise, professional immigration documents that comply with UK immigration law requirements.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: config.temperature || 0.3,
    max_tokens: config.maxTokens || 4000,
    stream: false,
  };
  
  console.log(`[Grok] Generating with ${params.model}...`);
  
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`xAI API error (${response.status}): ${error}`);
    }
    
    const data: GrokCompletionResponse = await response.json();
    
    const content = data.choices[0]?.message?.content || "";
    
    if (!content || content.trim().length < 200) {
      throw new Error(`Grok generated insufficient content: ${content.length} characters`);
    }
    
    console.log(`[Grok] ✅ Generated ${content.length} characters`);
    console.log(`[Grok] Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    
    return content;
    
  } catch (error) {
    console.error("[Grok] Generation failed:", error);
    throw error;
  }
}

/**
 * Check if xAI API is configured and available
 */
export function isGrokAvailable(): boolean {
  const apiKey = process.env.XAI_API_KEY;
  return !!(apiKey && apiKey !== "your_xai_api_key_here");
}
