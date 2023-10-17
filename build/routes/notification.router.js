"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
// External Dependencies
const express_1 = __importDefault(require("express"));
const passport = require("passport");
const database_service_1 = require("../services/database.service");
// Global Config
exports.notificationRouter = express_1.default.Router();
// GET list of unseen notifications
exports.notificationRouter.get("/", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const notifications = yield ((_a = database_service_1.collections.notifications) === null || _a === void 0 ? void 0 : _a.find({ userId: req.user._id, seen: false }).toArray());
        notifications && notifications.length > 0
            ? res.status(201).send(notifications)
            : res.status(200).send("No notifications found");
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
// PUT read all unseen notifications
exports.notificationRouter.put("/accept", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const notification = yield ((_b = database_service_1.collections.notifications) === null || _b === void 0 ? void 0 : _b.find({
            userId: req.user._id,
            seen: false,
        }).toArray());
        if (notification && notification.length > 0) {
            const result = yield ((_c = database_service_1.collections.notifications) === null || _c === void 0 ? void 0 : _c.updateMany({ userId: req.user._id, seen: false }, { $set: { seen: true } }));
            if (result === null || result === void 0 ? void 0 : result.modifiedCount) {
                res.status(201).json({ message: "Notifications successfully seen" });
            }
            else {
                res.status(500).json({ message: "Failed to update notification" });
            }
        }
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
