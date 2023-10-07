// External Dependencies
import express, { Request, Response } from "express";
const passport = require("passport");
import { ObjectId } from "mongodb";

import { collections } from "../services/database.service";
import Match from "../models/match";

// Global Config
export const matchRouter = express.Router();

// GET list of matches with keyword
matchRouter.get(
  "/matches/:keyword",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { keyword } = req.params;

      // Aggregation pipeline to find matches and then populate with requester's name
      const pipeline = [
        {
          $match: { productName: { $regex: keyword, $options: "i" } },
        },
        {
          $lookup: {
            from: "users",
            localField: "requesterId",
            foreignField: "_id",
            as: "requesterDetails",
          },
        },
        {
          $unwind: "$requesterDetails",
        },
        {
          $project: {
            productName: 1,
            "requesterDetails.first_name": 1,
            "requesterDetails.last_name": 1,
          },
        },
      ];

      const matches = await collections.matches?.aggregate(pipeline).toArray();

      res.status(201).send(matches);
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// GET user profile and the matched products
matchRouter.get(
  "/matches/:matchId/users/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { matchId, userId } = req.params;

      const pipeline = [
        {
          $match: {
            _id: new ObjectId(matchId),
            userId: new ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            productName: 1,
            "userDetails.first_name": 1,
            "userDetails.last_name": 1,
          },
        },
      ];

      const matchWithUserDetails = await collections.matches
        ?.aggregate(pipeline)
        .next();

      if (!matchWithUserDetails) {
        return res.status(404).json({ message: "Match not found" });
      }

      return res.status(200).json(matchWithUserDetails);
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// POST accept match
matchRouter.post(
  "/matches/:matchId/accept",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const query = { _id: new ObjectId(matchId) };

      // Check if the match accepted
      const match = await collections.matches?.findOne(query);

      if (match?.status === "accepted") {
        return res.status(400).json({ message: "Match already accepted" });
      }

      // Update the match status to accepted
      const result = await collections.matches?.updateOne(query, {
        $set: [{ status: "accepted" }, { requesteeId: req.user._id }],
      });

      if (result && result.modifiedCount) {
        res.status(201).json({
          message: "Match request accepted successfully",
        });
      } else if (!result) {
        throw new Error("Failed to accept match request.");
      } else if (!result.modifiedCount) {
        throw new Error(`Match with id ${matchId} does not exist`);
      }
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// POST matches
matchRouter.post(
  "/matches",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { productName, requester } = req.body;

      if (!productName || !requester) {
        return res
          .status(500)
          .json({ message: "Product name and Requester are required." });
      }

      // Create a new match object
      const newMatch = new Match(productName, new Date(), requester, "pending");

      // Store the match request in the database
      const result = await collections.matches?.insertOne(newMatch);

      if (result && result.acknowledged) {
        res.status(201).json({
          message: "Match request created successfully",
          matchId: result.insertedId,
        });
      } else if (!result || !result.acknowledged) {
        throw new Error("Failed to create a new match request.");
      }
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);
