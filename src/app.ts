// External Dependencies
import express, { Application } from "express";
const passport = require("passport");
require("dotenv").config();
var cors = require("cors");
import http from "http";
const socketIo = require("socket.io");

import { connectToDatabase } from "./services/database.service";

import configurePassport from "./passport-config";
configurePassport(passport);

import { authRouter } from "./routes/auth.router";
import { matchRouter } from "./routes/match.router";
import { userRouter } from "./routes/user.router";

// Global Config
const app: Application = express();

const PORT: number = 3001;

const httpServer = http.createServer(app);
const io = socketIo(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type"],
  },
});

app.use(cors());

connectToDatabase()
  .then(() => {
    app.use(passport.initialize());
    app.use(express.json());

    app.use((req, res, next) => {
      req.io = io;
      next();
    });

    app.use("/auth", authRouter);
    app.use("/matches", matchRouter);
    app.use("/users", userRouter);

    app.get(
      "/protected",
      passport.authenticate("jwt", { session: false }),
      (req, res) => {
        res.send("You have accessed a protected route!");
      }
    );

    httpServer.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
    process.exit();
  });

io.on("connection", (socket: any) => {
  console.log("Client connected");

  socket.on("joinRoom", (data: any) => {
    socket.join(data.userId);
    console.log(`User ${data.userId} joined room`);
  });

  socket.on("requestAccepted", (data: any) => {
    console.log("requestAccepted" + data.requesterId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
