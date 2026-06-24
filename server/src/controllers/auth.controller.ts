import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.model";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { initializeNewUser } from "../services/category.service";
import Expense from "../models/Expense.model";
import Category from "../models/Category.model";
import Budget from "../models/Budget.model";
import Income from "../models/Income.model";
import IncomeSource from "../models/IncomeSource.model";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
};

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    } as jwt.SignOptions,
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    } as jwt.SignOptions,
  );
  return { accessToken, refreshToken };
};

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError("Google ID token is required", 400);

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err: any) {
    throw new AppError("Invalid Google ID token", 400);
  }

  const payload = ticket.getPayload();
  if (!payload)
    throw new AppError("Incomplete profile information from Google", 400);

  const {
    sub: googleId,
    email,
    name: displayName,
    picture: photoURL,
  } = payload;
  if (!email || !displayName)
    throw new AppError("Incomplete profile information", 400);

  let user = await User.findOne({ googleId }).select("+refreshTokens");
  let isNewUser = false;

  if (!user) {
    user = await User.create({ googleId, email, displayName, photoURL });
    isNewUser = true;
  } else {
    user.email = email;
    user.displayName = displayName;
    user.photoURL = photoURL;
  }

  const { accessToken, refreshToken } = generateTokens(
    (user._id as any).toString(),
  );

  // Prune expired refresh tokens
  if (user.refreshTokens) {
    user.refreshTokens = user.refreshTokens.filter((token) => {
      try {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
        return true;
      } catch {
        return false;
      }
    });
  } else {
    user.refreshTokens = [];
  }

  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) {
    user.refreshTokens.shift();
  }
  await user.save();

  if (isNewUser) {
    await initializeNewUser(user._id as any);
  }

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { accessToken, refreshToken, user },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) throw new AppError("Refresh token required", 401);

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as { userId: string };
    const user = await User.findOne({
      _id: decoded.userId,
      refreshTokens: refreshToken,
    }).select("+refreshTokens");

    if (!user) throw new AppError("Invalid refresh token", 401);

    // Prune expired refresh tokens
    user.refreshTokens = (user.refreshTokens || []).filter((token) => {
      try {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
        return true;
      } catch {
        return false;
      }
    });

    const tokens = generateTokens((user._id as any).toString());
    user.refreshTokens = user.refreshTokens!.filter((t) => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } },
    );
  }

  res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
  res.json({ success: true, message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});

const updateSettingsSchema = z.object({
  dataRetentionMonths: z.number().int().min(1).max(120).optional(),
  currency: z.string().min(1).max(10).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const validated = updateSettingsSchema.parse(req.body);
    const updates: Record<string, any> = {};
    if (validated.dataRetentionMonths !== undefined)
      updates["settings.dataRetentionMonths"] = validated.dataRetentionMonths;
    if (validated.currency !== undefined)
      updates["settings.currency"] = validated.currency;
    if (validated.theme !== undefined)
      updates["settings.theme"] = validated.theme;

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: updates },
      { new: true },
    );
    res.json({ success: true, data: user });
  },
);

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Promise.all([
        Expense.deleteMany({ userId }, { session }),
        Category.deleteMany({ userId }, { session }),
        Budget.deleteMany({ userId }, { session }),
        Income.deleteMany({ userId }, { session }),
        IncomeSource.deleteMany({ userId }, { session }),
      ]);
      await User.findByIdAndDelete(userId, { session });
    });
    session.endSession();

    res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
    res.json({ success: true, message: "Account deleted" });
  },
);
