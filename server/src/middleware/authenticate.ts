import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User.model";
import { AppError } from "../utils/AppError";

const verifyAndDecodeToken = (req: Request): { userId: string } => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    userId: string;
  };

  if (!mongoose.isValidObjectId(decoded.userId)) {
    throw new AppError("Invalid token format", 401);
  }

  return decoded;
};

const handleJwtError = (error: unknown, next: NextFunction) => {
  if (error instanceof jwt.TokenExpiredError) {
    next(new AppError("Token expired", 401));
  } else if (error instanceof jwt.JsonWebTokenError) {
    next(new AppError("Invalid token", 401));
  } else {
    next(error);
  }
};

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const decoded = verifyAndDecodeToken(req);
    const user = await User.findById(decoded.userId);
    if (!user) throw new AppError("User not found", 401);

    req.user = user;
    next();
  } catch (error) {
    handleJwtError(error, next);
  }
};

export const authenticateLean = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const decoded = verifyAndDecodeToken(req);
    req.user = { _id: decoded.userId } as unknown as IUser;
    next();
  } catch (error) {
    handleJwtError(error, next);
  }
};
