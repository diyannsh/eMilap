import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message cannot exceed 500 characters"),
  communityId: z.string().uuid("Invalid community ID").optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
