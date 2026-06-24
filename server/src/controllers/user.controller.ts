import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/User.model";

export const getFrequencyMap = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.user!._id).select(
      "settings.frequencyMap",
    );
    res.json({ success: true, data: user?.settings?.frequencyMap || {} });
  },
);

export const updateFrequencyMap = asyncHandler(
  async (req: Request, res: Response) => {
    const { frequencyMap } = req.body;
    await User.findByIdAndUpdate(req.user!._id, {
      $set: { "settings.frequencyMap": frequencyMap },
    });
    res.json({ success: true });
  },
);
