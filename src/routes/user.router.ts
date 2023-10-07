// External Dependencies
import express, { Request, Response } from "express";
const passport = require("passport");
import { ObjectId } from "mongodb";

import { collections } from "../services/database.service";
import User from "../models/user";

// Global Config
export const userRouter = express.Router();

// GET recent matches for a specific user
userRouter.get(
  "/users/:userId/recent",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Retrieve recent matches for the user
      const recentMatches = await collections.matches
        ?.find([{ userId: new ObjectId(userId) }, { status: "accepted" }])
        .sort({ created_date: -1 })
        .limit(10)
        .toArray();

      !recentMatches?.length
        ? res
            .status(404)
            .json({ message: "No recent matches found for this user" })
        : res.status(200).json(recentMatches);
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);
