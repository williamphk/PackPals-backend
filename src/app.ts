// External Dependencies
import express, { Application } from "express";
const passport = require("passport");
require("dotenv").config();
import { connectToDatabase } from "./services/database.service";
import configurePassport from "./passport-config";
configurePassport(passport);
import { authRouter } from "./routes/auth.router";
var cors = require("cors");

// Global Config
const app: Application = express();

const PORT: number = 3001;

app.use(cors());

connectToDatabase()
  .then(() => {
    app.use(passport.initialize());
    app.use(express.json());

    app.use("/auth", authRouter);

    app.get(
      "/protected",
      passport.authenticate("jwt", { session: false }),
      (req, res) => {
        res.send("You have accessed a protected route!");
      }
    );

    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
    process.exit();
  });
