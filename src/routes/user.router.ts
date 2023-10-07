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

      // Aggregation pipeline to find recent matches and then populate with requester's name
      const pipeline = [
        {
          $match: {
            requesterId: new ObjectId(userId),
            status: "accepted",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "requesterId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $project: {
            product_name: 1,
            "userDetails.first_name": 1,
            "userDetails.last_name": 1,
          },
        },
        {
          $sort: { created_date: -1 },
        },
        {
          $limit: 10,
        },
      ];

      // Retrieve recent matches for the user
      const recentMatches = await collections.matches
        ?.aggregate(pipeline)
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

// GET ongoing matches for a specific user
userRouter.get(
  "/users/:userId/ongoing",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Aggregation pipeline to find ongoing matches and then populate with requester's name
      const pipeline = [
        {
          $match: {
            requesterId: new ObjectId(userId),
            status: "pending",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "requesterId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $project: {
            product_name: 1,
            "userDetails.first_name": 1,
            "userDetails.last_name": 1,
          },
        },
        {
          $sort: { created_date: -1 },
        },
        {
          $limit: 10,
        },
      ];

      // Retrieve recent matches for the user
      const onGoingMatches = await collections.matches
        ?.aggregate(pipeline)
        .toArray();

      !onGoingMatches?.length
        ? res
            .status(404)
            .json({ message: "No recent matches found for this user" })
        : res.status(200).json(onGoingMatches);
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// GET you might also like for a specific user
userRouter.get(
  "/users/:userId/like",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      // Aggregation pipeline to find ongoing matches and then populate with requester's name
      const pipeline = [
        {
          $match: {
            status: "pending",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "requesterId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $project: {
            product_name: 1,
            "userDetails.first_name": 1,
            "userDetails.last_name": 1,
          },
        },
        {
          $sort: { created_date: -1 },
        },
        {
          $limit: 10,
        },
      ];

      // Retrieve recent matches for the user
      const mightLikeMatches = await collections.matches
        ?.aggregate(pipeline)
        .toArray();

      !mightLikeMatches?.length
        ? res
            .status(404)
            .json({ message: "No recent matches found for this user" })
        : res.status(200).json(mightLikeMatches);
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);
