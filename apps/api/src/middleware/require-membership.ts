import { Router } from "express";

export const requireMembership = Router();

requireMembership.use(async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
  }
  // Placeholder: verify active membership for community scope (full check deferred to Milestone 4 integration)
  if (req.params.communityId && !req.session?.communityId) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Community membership required" } });
  }
  next();
});
