import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Log all errors
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    stack: err.stack,
    userId: (req as any).user?._id,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid ID format" });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  // MongoDB duplicate key
  if ((err as any).code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate entry" });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired" });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
