import { Router } from "express";

export const membershipRouter = Router();

// POST /api/v1/communities/:id/join (skeleton — active membership selection)
membershipRouter.post("/:id/join", async (req, res, next) => {
  try {
    // Placeholder: full integration requires DB check + session update
    res.json({ data: { message: "Membership join endpoint present (Milestone 4). Active membership enforced server-side." } });
  } catch (err) {
    next(err);
  }
});
