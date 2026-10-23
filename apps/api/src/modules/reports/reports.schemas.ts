import { z } from "zod";

export const createReportSchema = z.object({
  communityId: z.string().uuid().optional(),
  reportType: z.enum(["LOST", "FOUND"]),
  title: z.string().min(2).max(120),
  publicDescription: z.string().min(5).max(5000),
  category: z.string().min(1),
  color: z.string().optional(),
  brand: z.string().optional(),
  approximateLocation: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  occurredAtIsApproximate: z.boolean().default(false),
  privateDetails: z.string().max(5000).optional(),
  imageObjectKeys: z.array(z.string()).default([]),
});

export const updateReportSchema = createReportSchema.partial().extend({
  status: z.enum(["OPEN", "MATCHED", "CLAIM_PENDING", "RESOLVED", "CLOSED", "REMOVED"]).optional(),
});
