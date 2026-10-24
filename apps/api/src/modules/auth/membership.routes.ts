import { Router } from "express";
import { prisma } from "../../db/client";

export const membershipRouter = Router();

// GET /api/v1/communities — list active communities
membershipRouter.get("/", async (_req, res, next) => {
  try {
    const communities = await prisma.community.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    });
    res.json({ data: communities });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/communities/:id — get single community details
membershipRouter.get("/:id", async (req, res, next) => {
  try {
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: req.params.id }, { slug: req.params.id }],
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    });
    if (!community) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Community not found" } });
    }
    res.json({ data: community });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/communities — create a new community (if none exist or admin setup)
membershipRouter.post("/", async (req, res, next) => {
  try {
    const { name, slug, description } = req.body || {};
    if (!name || !slug) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Name and slug are required" } });
    }
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const existing = await prisma.community.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return res.status(409).json({ error: { code: "CONFLICT", message: "Community slug already exists" } });
    }
    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description ? description.trim() : null,
      },
    });
    res.status(201).json({ data: community });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/communities/:id/join — join active community for authenticated user
membershipRouter.post("/:id/join", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required to join a community" } });
    }

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: req.params.id }, { slug: req.params.id }],
        isActive: true,
      },
    });
    if (!community) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Community not found" } });
    }

    // Upsert membership
    const membership = await prisma.communityMembership.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
      update: {
        status: "ACTIVE",
      },
      create: {
        userId,
        communityId: community.id,
        role: "MEMBER",
        status: "ACTIVE",
      },
    });

    req.session!.communityId = community.id;
    req.session!.role = membership.role;

    req.session!.save((saveErr) => {
      if (saveErr) return next(saveErr);
      res.json({
        data: {
          message: "Successfully joined community",
          communityId: community.id,
          communityName: community.name,
          role: membership.role,
        },
      });
    });
  } catch (err) {
    next(err);
  }
});
