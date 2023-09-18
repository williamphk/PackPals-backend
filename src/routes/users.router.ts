// External Dependencies
import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../services/database.service";
import User from "../models/user";

// Global Config
export const usersRouter = express.Router();

usersRouter.use(express.json());

// GET
usersRouter.get("/", async (_req: Request, res: Response) => {
  try {
    if (!collections.users) {
      res.status(500).send("Users collection not initialized");
      return;
    }

    const users = (await collections.users
      .find({})
      .toArray()) as unknown as User[];

    res.status(200).send(users);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unexpected error occurred");
    }
  }
});

// POST

// PUT

// DELETE
