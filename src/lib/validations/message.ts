import { z } from "zod";

// Message schema for creating new messages
// Client can ONLY create USER messages
export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message is too long (max 5000 characters)"),
  intent: z.enum(["QUESTION", "INSTRUCTION"], {
    errorMap: () => ({ message: "User messages must be QUESTION or INSTRUCTION" }),
  }),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
