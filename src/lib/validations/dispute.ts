import { z } from "zod";

// Dispute type options
export const DISPUTE_TYPES = [
  // Traffic & Fines
  { value: "speeding_ticket", label: "Speeding Ticket", icon: "🚗" },
  { value: "parking_fine", label: "Parking Fine", icon: "🅿️" },
  
  // Housing
  { value: "landlord", label: "Landlord Dispute", icon: "🏠" },
  { value: "neighbour", label: "Neighbour Dispute", icon: "🏘️" },
  { value: "noise_complaint", label: "Noise Complaint", icon: "🔊" },
  
  // Employment
  { value: "employment", label: "Employment Issue", icon: "💼" },
  { value: "discrimination", label: "Discrimination", icon: "⚖️" },
  { value: "harassment", label: "Harassment", icon: "🚫" },
  
  // Consumer & Services
  { value: "consumer", label: "Consumer Rights", icon: "📱" },
  { value: "flight_delay", label: "Flight Delay", icon: "✈️" },
  { value: "medical", label: "Medical Complaint", icon: "🏥" },
  { value: "insurance", label: "Insurance Dispute", icon: "📋" },
  
  // Legal & Government
  { value: "benefits", label: "Benefits Appeal", icon: "💰" },
  { value: "immigration", label: "Immigration", icon: "🛂" },
  { value: "council_tax", label: "Council Tax", icon: "🏛️" },
  { value: "criminal_appeal", label: "Criminal Appeal", icon: "⚔️" },
  
  // Other
  { value: "defamation", label: "Defamation", icon: "📰" },
  { value: "contract", label: "Contract Dispute", icon: "📄" },
  { value: "small_claims", label: "Small Claims", icon: "💷" },
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
