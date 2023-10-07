// External Dependencies
import express, { Request, Response } from "express";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");

import { collections } from "../services/database.service";
import User from "../models/user";

// Global Config
export const authRouter = express.Router();

authRouter.use(express.json());

// POST Register
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

// POST Login
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
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.hashed_password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    console.log(hashedRefreshToken);

    await collections.users.updateOne(
      { email: user.email },
      { $set: { refreshToken: hashedRefreshToken } }
    );

    res.json({ message: "Logged in successfully", token, refreshToken });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unexpected error occurred");
    }
  }
});

// POST Token
authRouter.post(
  "/token",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const user = req.user;

    const { refreshToken } = req.body;

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    if (!collections.users) {
      res.status(500).send("Users collection not initialized");
      return;
    }

    await collections.users.updateOne(
      { email: user.email },
      { $set: { refreshToken: hashedNewRefreshToken } }
    );

    res.json({ message: "New access token generated", token: newToken });
  }
);

// GET Logout
authRouter.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const user = req.user;

    const { refreshToken } = req.body;

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    user.refreshToken = null;
    res.json({ message: "User logged out successfully" });
  }
);
