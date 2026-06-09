import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import mongoose from "mongoose";

/**
 * Factory that returns middleware verifying a Mongoose document's userId
 * matches req.user._id before allowing the operation to proceed.
 *
 * Usage: router.delete('/:id', authenticate, ownershipGuard(Expense), controller)
 */
export const ownershipGuard =
  (Model: mongoose.Model<any>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw new AppError("Resource not found", 404);
      if (doc.userId.toString() !== req.user!._id.toString()) {
        throw new AppError("Forbidden", 403);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
