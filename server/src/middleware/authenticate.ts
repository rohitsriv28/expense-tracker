import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User.model";
import { AppError } from "../utils/AppError";

// Extend Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    // Extract token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await User.findById(decoded.userId);
    if (!user) throw new AppError("User not found", 401);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token expired", 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Invalid token", 401));
    } else {
      next(error);
    }
  }
};
