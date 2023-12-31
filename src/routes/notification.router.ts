// External Dependencies
import express, { Request, Response } from "express";
const passport = require("passport");

import { collections } from "../services/database.service";

// Global Config
export const notificationRouter = express.Router();

// GET list of notifications
notificationRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const notifications = await collections.notifications
        ?.find({ userId: req.user._id })
        .sort({ created_date: -1 })
        .toArray();

      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

// GET number of unseen notifications
notificationRouter.get(
  "/count",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const count = await collections?.notifications?.countDocuments({
        userId: req.user._id,
        seen: false,
      });

      res.status(201).send({ count });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

// PUT read all unseen notifications
notificationRouter.put(
  "/accept",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const notification = await collections.notifications
        ?.find({
          userId: req.user._id,
          seen: false,
        })
        .toArray();

      if (notification && notification.length > 0) {
        const result = await collections.notifications?.updateMany(
          { userId: req.user._id, seen: false },
          { $set: { seen: true } }
        );
        if (result?.modifiedCount) {
          res.status(201).json({ message: "Notifications successfully seen" });
        } else {
          res.status(500).json({ message: "Failed to update notification" });
        }
      } else {
        res.status(200).json({ message: "No notifications to update" });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
);
