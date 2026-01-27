// Shared TypeScript types and interfaces
// Add your types here as the application grows

export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};
