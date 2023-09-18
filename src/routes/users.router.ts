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
usersRouter.post("/", async (req: Request, res: Response) => {
  try {
    if (!collections.users) {
      res.status(500).send("Users collection not initialized");
      return;
    }

    const newUser = req.body as User;
    const result = await collections.users.insertOne(newUser);

    result
      ? res
          .status(201)
          .send(`Successfully created a new user with id ${result.insertedId}`)
      : res.status(500).send("Failed to create a new user.");
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unexpected error occurred");
    }
  }
});

// PUT
usersRouter.put("/:id", async (req: Request, res: Response) => {
  const id = req?.params?.id;

  try {
    if (!collections.users) {
      res.status(500).send("Users collection not initialized");
      return;
    }

    const updatedUser: User = req.body as User;
    const query = { _id: new ObjectId(id) };

    const result = await collections.users.updateOne(query, {
      $set: updatedUser,
    });

    result
      ? res.status(200).send(`Successfully updated user with id ${id}`)
      : res.status(304).send(`User with id: ${id} not updated`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unexpected error occurred");
    }
  }
});

// DELETE
usersRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = req?.params?.id;

  try {
    if (!collections.users) {
      res.status(500).send("Users collection not initialized");
      return;
    }

    const query = { _id: new ObjectId(id) };
    const result = await collections.users.deleteOne(query);

    if (result && result.deletedCount) {
      res.status(202).send(`Successfully removed user with id ${id}`);
    } else if (!result) {
      res.status(400).send(`Failed to remove user with id ${id}`);
    } else if (!result.deletedCount) {
      res.status(404).send(`User with id ${id} does not exist`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unexpected error occurred");
    }
  }
});
