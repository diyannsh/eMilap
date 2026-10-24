import { z } from "zod";

export const chatHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant", "bot", "model"]),
  content: z.string().trim().max(1000, "History message cannot exceed 1000 characters"),
});

export const chatMessageSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message cannot exceed 500 characters"),
  communityId: z.string().uuid("Invalid community ID").optional(),
  history: z.array(chatHistoryItemSchema).max(10, "History cannot exceed 10 messages").optional(),
});

export type ChatHistoryItem = z.infer<typeof chatHistoryItemSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
