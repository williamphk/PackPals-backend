// External Dependencies
import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
import { collections } from "../services/database.service";
import User from "../models/user";

// Global Config
export const authRouter = express.Router();

authRouter.use(express.json());

// REGISTER
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    if (!collections.users) {
      res.status(500).send("Users collection not initialized");
      return;
    }

    const newUser = req.body as User;
    const hashedPassword = await bcrypt.hash(req.body.hashed_password, 10);
    newUser.hashed_password = hashedPassword;
    newUser.created_date = new Date(newUser.created_date);
    const result = await collections.users.insertOne(newUser);

    result
      ? res
          .status(201)
          .send(`User registered successfully with id ${result.insertedId}`)
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

// LOGIN
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!collections.users) {
      res.status(500).send("Users collection not initialized");
      return;
    }

    const user = (await collections.users.findOne({
      email: email,
    })) as User | null;

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.hashed_password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Logged in successfully", token });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unexpected error occurred");
    }
  }
});
