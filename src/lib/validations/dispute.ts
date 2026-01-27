import { z } from "zod";

// Dispute type options
export const DISPUTE_TYPES = [
  { value: "speeding_ticket", label: "Speeding Ticket", icon: "🚗" },
  { value: "parking_fine", label: "Parking Fine", icon: "🅿️" },
  { value: "landlord", label: "Landlord Dispute", icon: "🏠" },
  { value: "employment", label: "Employment Issue", icon: "💼" },
  { value: "flight_delay", label: "Flight Delay", icon: "✈️" },
  { value: "consumer", label: "Consumer Rights", icon: "📱" },
  { value: "benefits", label: "Benefits Appeal", icon: "💰" },
  { value: "immigration", label: "Immigration", icon: "🛂" },
  { value: "other", label: "Other", icon: "📝" },
] as const;

// Evidence file metadata
export const evidenceFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string().optional(), // For future file storage
});

// Create dispute schema
export const createDisputeSchema = z.object({
  type: z.string().min(1, "Please select a dispute type"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z
    .string()
    .min(100, "Please provide at least 100 characters")
    .max(5000, "Description is too long"),
  evidenceFiles: z.array(evidenceFileSchema).max(5).optional(),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type EvidenceFile = z.infer<typeof evidenceFileSchema>;
