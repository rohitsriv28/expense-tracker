import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import axios from "axios";
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
  const { accessToken: googleAccessToken } = req.body;
  if (!googleAccessToken)
    throw new AppError("Google access token is required", 400);

  const googleResponse = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    },
  );

  const {
    sub: googleId,
    email,
    name: displayName,
    picture: photoURL,
  } = googleResponse.data;
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

  if (!user.refreshTokens) user.refreshTokens = [];
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
    data: { accessToken, user },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
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

    const tokens = generateTokens((user._id as any).toString());
    user.refreshTokens = user.refreshTokens!.filter((t) => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken: tokens.accessToken },
    });
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshTokens: refreshToken },
      { $pull: { refreshTokens: refreshToken } },
    );
  }

  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: { settings: { ...req.user!.settings, ...req.body } } },
      { new: true },
    );
    res.json({ success: true, data: user });
  },
);

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;

    // The backend has deleteAccount function, but the function currently do not have that feature yet.
    // We will add the feature in future, so this code is kept here but statically imported for safety.
    await Expense.deleteMany({ userId });
    await Category.deleteMany({ userId });
    await Budget.deleteMany({ userId });
    await Income.deleteMany({ userId });
    await IncomeSource.deleteMany({ userId });

    await User.findByIdAndDelete(userId);
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Account deleted" });
  },
);
