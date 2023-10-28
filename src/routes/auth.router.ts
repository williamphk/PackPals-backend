// External Dependencies
import express, { Request, Response } from "express";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
import { ObjectId } from "mongodb";
import { body, validationResult } from "express-validator";

import { collections } from "../services/database.service";
import User from "../models/user";

// Global Config
export const authRouter = express.Router();

// POST Register
const registerValidation = [
  body("first_name")
    .notEmpty()
    .withMessage("First name is required.")
    .isLength({ max: 50 })
    .withMessage("First name must be less than 50 characters.")
    .isAlpha()
    .withMessage("First name must be alphabetic.")
    .trim()
    .escape()
    .toLowerCase(),
  body("last_name")
    .notEmpty()
    .withMessage("Last name is required.")
    .isLength({ max: 50 })
    .withMessage("Last name must be less than 50 characters.")
    .isAlpha()
    .withMessage("Last name must be alphabetic.")
    .trim()
    .escape()
    .toLowerCase(),
  body("email")
    .isEmail()
    .withMessage("Enter a valid email address.")
    .custom(async (value) => {
      const query = { email: value };
      const user = await collections.users?.findOne(query);
      if (user) {
        return Promise.reject("Email already in use");
      }
    })
    .toLowerCase()
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
  body("postal_code")
    .matches(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/)
    .withMessage("Enter a valid postal code.")
    .trim()
    .escape()
    .toUpperCase(),
];

authRouter.post(
  "/register",
  registerValidation,
  async (req: Request, res: Response) => {
    try {
      const {
        first_name,
        last_name,
        email,
        password,
        postal_code,
        created_date,
      } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(401).json({ errors: errors.array() });
      }

      const newUser: User = {
        first_name,
        last_name,
        email,
        hashed_password: password,
        postal_code,
        created_date,
      };

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      newUser.hashed_password = hashedPassword;
      newUser.created_date = new Date(newUser.created_date);
      const result = await collections.users?.insertOne(newUser);

      result
        ? res
            .status(201)
            .send(`User registered successfully with id ${result.insertedId}`)
        : res.status(500).send("Failed to create a new user.");
    } catch (error: any) {
      console.log(error.errInfo.details.schemaRulesNotSatisfied);
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// POST Login
const loginValidation = [
  body("email").isEmail().withMessage("Enter a valid email address."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long."),
];

authRouter.post(
  "/login",
  loginValidation,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(401).json({ errors: errors.array() });
      }

      const query = { email: email };
      const user = await collections.users?.findOne(query);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        user.hashed_password
      );

      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const refreshToken = crypto.randomBytes(64).toString("hex");
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      await collections.users?.updateOne(
        { email: user.email },
        { $set: { refreshToken: hashedRefreshToken } }
      );

      res.status(201).json({
        message: "Logged in successfully",
        token: token,
        refreshToken: refreshToken,
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// POST Token
authRouter.post("/token", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const user = await findUserByRefreshToken(refreshToken);

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await collections.users?.updateOne(
      { email: user.email },
      { $set: { refreshToken: hashedNewRefreshToken } }
    );

    res.status(201).json({
      message: "New access token generated",
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).send("An unexpected error occurred");
  }
});

async function findUserByRefreshToken(refreshToken: string) {
  const users = await collections.users?.find().toArray();

  if (!users) {
    return null;
  }

  for (let user of users) {
    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (isMatch) {
      return user;
    }
  }

  return null;
}

export default findUserByRefreshToken;

// GET Logout
authRouter.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;

      const { refreshToken } = req.body;

      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatch) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      user.refreshToken = null;
      res.status(201).json({ message: "User logged out successfully" });
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);

// DELETE Profile
authRouter.delete(
  "/profile/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const query = { _id: new ObjectId(userId) };
      const result = await collections.users?.deleteOne(query);

      if (result && result.deletedCount) {
        res.status(202).send(`Successfully removed user with id ${userId}`);
      } else if (!result) {
        res.status(400).send(`Failed to remove user with id ${userId}`);
      } else if (!result.deletedCount) {
        res.status(404).send(`User with id ${userId} does not exist`);
      }
    } catch (error) {
      res.status(500).send("An unexpected error occurred");
    }
  }
);
