// External Dependencies
import express, { Request, Response } from "express";
const passport = require("passport");
import { ObjectId } from "mongodb";
import { body } from "express-validator";

import { collections } from "../services/database.service";
import Match from "../models/match";

// Global Config
export const matchRouter = express.Router();

// GET list of matches with keyword
matchRouter.get(
  "/:keyword",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { keyword } = req.params;

      console.log(keyword);

      // Aggregation pipeline to find matches and then populate with requester's name
      const pipeline = [
        {
          $match: {
            product_name: { $regex: keyword, $options: "i" },
            requesterId: { $ne: req.user._id },
            status: "pending",
          },
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
            product_name: 1,
            "requesterDetails.first_name": 1,
            "requesterDetails.last_name": 1,
          },
        },
      ];

      const matches = await collections.matches?.aggregate(pipeline).toArray();
      console.log(matches);
      matches
        ? res.status(201).send(matches)
        : res.status(404).send("No matches found");
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// GET user profile and the matched products
matchRouter.get(
  "/:matchId",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;

      // Aggregation pipeline to find specific match and then populate with requester's name
      const pipeline = [
        {
          $match: {
            _id: new ObjectId(matchId),
          },
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

      const matchWithUserDetails = await collections.matches
        ?.aggregate(pipeline)
        .next();

      matchWithUserDetails
        ? res.status(200).json(matchWithUserDetails)
        : res.status(404).json({ message: "Match not found" });
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// POST accept match
matchRouter.post(
  "/:matchId/accept",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const requester = req.user._id;
      const query = { _id: new ObjectId(matchId) };

      const match = await collections.matches?.findOne(query);

      // Check if the match is created by the user
      if (match?.requesterId.equals(requester)) {
        return res
          .status(400)
          .json({ message: "You cannot accept your own match request" });
      }

      // Check if the match accepted
      if (match?.status === "accepted") {
        return res.status(400).json({ message: "Match already accepted" });
      }

      // Update the match status to accepted
      const result = await collections.matches?.updateOne(query, {
        $set: [{ status: "accepted" }, { requesteeId: req.user._id }],
      });

      result?.modifiedCount
        ? res
            .status(201)
            .json({ message: "Match request accepted successfully" })
        : res.status(500).json({ message: "Failed to accept match request" });
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// POST matches
const matchValidation = [
  body("productName")
    .not()
    .isEmpty()
    .withMessage("Product name is required")
    .trim()
    .escape(),
];

matchRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  matchValidation,
  async (req: Request, res: Response) => {
    try {
      const { product_name } = req.body;
      console.log(req.user._id);
      const requester = req.user._id;

      // Create a new match object
      const newMatch = new Match(
        product_name,
        new Date(),
        requester,
        "pending"
      );

      console.log(newMatch);

      // Store the match request in the database
      const result = await collections.matches?.insertOne(newMatch);

      result?.acknowledged
        ? res.status(201).json({
            message: "Match request created successfully",
            matchId: result.insertedId,
          })
        : res
            .status(500)
            .json({ message: "Failed to create a match request." });
    } catch (error: any) {
      console.log(
        error.errInfo.details.schemaRulesNotSatisfied[0]
          .propertiesNotSatisfied[0]
      );
      res.status(500).send("An unexpected error occurred");
    }
  }
);
