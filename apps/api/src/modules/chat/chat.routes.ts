import { Router } from "express";
import { chatMessageSchema } from "./chat.schemas";
import { chatService } from "./chat.service";
import { createRateLimiter } from "../../middleware/rate-limiter";

export const chatRouter = Router();

// Rate limiter: 40 messages per 15 minutes per user/IP
const chatLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Chat message limit reached. Please wait a few minutes before sending more questions.",
});

// POST /api/v1/chat — ask e-Milap campus recovery assistant
chatRouter.post("/", chatLimiter, async (req, res, next) => {
  try {
    const data = chatMessageSchema.parse(req.body);
    const targetCommunityId = data.communityId || req.session?.communityId;

    const result = await chatService.handleMessage(data.message, targetCommunityId, data.history);

    res.json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
