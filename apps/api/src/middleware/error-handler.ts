import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid fields", fieldErrors: error.flatten().fieldErrors } });
  const s = (error as any).statusCode || (error as any).status || 500;
  res.status(s).json({ error: { code: (error as any).code || "INTERNAL_ERROR", message: (error as any).message || "Unexpected error" } });
};
