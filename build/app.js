"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_service_1 = require("./services/database.service");
const users_router_1 = require("./routes/users.router");
const app = (0, express_1.default)();
const PORT = 3001;
(0, database_service_1.connectToDatabase)()
    .then(() => {
    app.use("/users", users_router_1.usersRouter);
    app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("Database connection failed", error);
    process.exit();
});
