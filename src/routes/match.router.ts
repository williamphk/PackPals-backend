// External Dependencies
import express, { Request, Response } from "express";
const passport = require("passport");
import { ObjectId } from "mongodb";
import { body } from "express-validator";

import { collections } from "../services/database.service";
import Match from "../models/match";
import Notification from "../models/notification";

// Global Config
export const matchRouter = express.Router();

// GET list of matches with keyword
matchRouter.get(
  "/:keyword",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { keyword } = req.params;

      //console.log(keyword);

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
            requesterId: 1,
            "requesterDetails.first_name": 1,
            "requesterDetails.last_name": 1,
            "requesterDetails.postal_code": 1,
          },
        },
        {
          $sort: { created_date: -1 },
        },
      ];

      const matches = await collections.matches?.aggregate(pipeline).toArray();

      matches && matches.length > 0
        ? res.status(201).send(matches)
        : res
            .status(200)
            .send(
              "No matches found currently. Don't worry! You can host a match below!"
            );
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
      const userId = req.user._id;
      const query = { _id: new ObjectId(matchId) };

      const match = await collections.matches?.findOne(query);
      const user = await collections.users?.findOne({ _id: userId });

      // Check if the match is created by the user
      if (match?.requesterId.equals(userId)) {
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
        $set: { status: "accepted", requesteeId: req.user._id },
      });

      if (result?.modifiedCount) {
        const notification = new Notification(
          match?.requesterId,
          `Your ${match?.product_name}'s match request has been accepted by ${user?.first_name} ${user?.last_name}!`,
          false,
          new Date()
        );

        // Store the notification in the database
        await collections.notifications?.insertOne(notification);

        // Emit the event for the match being accepted
        req.socketServer
          .to(match?.requesterId.toString())
          .emit("notification", {
            message: `Your ${match?.product_name}'s match request has been accepted by ${user?.first_name} ${user?.last_name}!`,
          });

        res
          .status(201)
          .json({ message: "Match request accepted successfully" });
      } else {
        res.status(500).json({ message: "Failed to accept match request" });
      }
    } catch (error) {
      console.log(error);
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

      const requester = req.user._id;

      // Create a new match object
      const newMatch = new Match(
        product_name,
        new Date(),
        requester,
        "pending"
      );

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

// DELETE match
matchRouter.delete(
  "/:matchId",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const requester = req.user._id;
      const query = { _id: new ObjectId(matchId) };

      const match = await collections.matches?.findOne(query);

      // Check if the match is created by the user
      if (!match?.requesterId.equals(requester)) {
        return res
          .status(400)
          .json({ message: "You cannot delete someone else's match request" });
      }

      // Check if the match is already accepted
      if (match?.status === "accepted") {
        return res
          .status(400)
          .json({ message: "You cannot delete an accepted match request" });
      }

      // Delete the match request
      const result = await collections.matches?.deleteOne(query);

      result?.deletedCount
        ? res
            .status(200)
            .json({ message: "Match request deleted successfully" })
        : res.status(500).json({ message: "Failed to delete match request" });
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);
