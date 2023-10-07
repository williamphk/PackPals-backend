// External Dependencies
import express, { Request, Response } from "express";
const passport = require("passport");

import { collections } from "../services/database.service";
import Match from "../models/match";

// Global Config
export const matchRouter = express.Router();

matchRouter.use(express.json());

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

      if (!collections.matches) {
        res.status(500).send("Matches collection not initialized");
        return;
      }

      // Store the match request in the database
      const result: any = await collections.matches.insertOne(newMatch);

      if (result.insertedCount === 0) {
        throw new Error("Failed to create match request.");
      }

      res.status(201).json({
        message: "Match request created successfully",
        matchId: result.insertedId,
      });
    } catch (error) {
      console.error("Error creating match request:", error);
      res.status(500).send("An unexpected error occurred");
    }
  }
);
