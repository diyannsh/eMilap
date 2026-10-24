import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Valid email required").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Display name required").max(120),
  communitySlug: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email required").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password required"),
});
