"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// External Dependencies
const express_1 = __importDefault(require("express"));
const passport = require("passport");
require("dotenv").config();
var cors = require("cors");
const http_1 = __importDefault(require("http"));
const socketIo = require("socket.io");
const database_service_1 = require("./services/database.service");
const passport_config_1 = __importDefault(require("./passport-config"));
(0, passport_config_1.default)(passport);
const auth_router_1 = require("./routes/auth.router");
const match_router_1 = require("./routes/match.router");
const user_router_1 = require("./routes/user.router");
// Global Config
const app = (0, express_1.default)();
const PORT = 443;
const httpServer = http_1.default.createServer(app);
const io = socketIo(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["content-type"],
    },
});
app.use(cors());
(0, database_service_1.connectToDatabase)()
    .then(() => {
    app.use(passport.initialize());
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        req.socketServer = io;
        next();
    });
    app.use("/auth", auth_router_1.authRouter);
    app.use("/matches", match_router_1.matchRouter);
    app.use("/users", user_router_1.userRouter);
    app.get("/protected", passport.authenticate("jwt", { session: false }), (req, res) => {
        res.send("You have accessed a protected route!");
    });
    httpServer.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("Database connection failed", error);
    process.exit();
});
io.on("connection", (socket) => {
    console.log("Client connected");
    socket.on("joinRoom", (data) => {
        socket.join(data.userId);
        console.log(`User ${data.userId} joined room`);
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});
