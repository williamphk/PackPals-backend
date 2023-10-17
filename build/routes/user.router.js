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
exports.userRouter = void 0;
// External Dependencies
const express_1 = __importDefault(require("express"));
const passport = require("passport");
const mongodb_1 = require("mongodb");
const database_service_1 = require("../services/database.service");
// Global Config
exports.userRouter = express_1.default.Router();
// GET recent matches for a specific user
exports.userRouter.get("/:userId/recent", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = req.params;
        // Aggregation pipeline to find recent matches and then populate with requestee's name
        const pipeline = [
            {
                $match: {
                    $or: [
                        { requesterId: new mongodb_1.ObjectId(userId) },
                        { requesteeId: new mongodb_1.ObjectId(userId) },
                    ],
                    status: "accepted",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "requesteeId",
                    foreignField: "_id",
                    as: "requesteeDetails",
                },
            },
            {
                $unwind: "$requesteeDetails",
            },
            {
                $lookup: {
                    from: "users",
                    localField: "requesteeId",
                    foreignField: "_id",
                    as: "requesteeDetails",
                },
            },
            {
                $unwind: "$requesteeDetails",
            },
            {
                $lookup: {
                    from: "users",
                    localField: "requesterId",
                    foreignField: "_id",
                    as: "requesterDetails",
                },
            },
            {
                $unwind: "$requesterDetails",
            },
            {
                $project: {
                    product_name: 1,
                    created_date: 1,
                    requesteeId: 1,
                    "requesteeDetails.first_name": 1,
                    "requesteeDetails.last_name": 1,
                    "requesteeDetails.email": 1,
                    requesterId: 1,
                    "requesterDetails.first_name": 1,
                    "requesterDetails.last_name": 1,
                    "requesterDetails.email": 1,
                },
            },
            {
                $sort: { created_date: -1 },
            },
        ];
        // Retrieve recent matches for the user
        const recentMatches = yield ((_a = database_service_1.collections.matches) === null || _a === void 0 ? void 0 : _a.aggregate(pipeline).toArray());
        res.status(200).json(recentMatches);
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
// GET ongoing matches for a specific user
exports.userRouter.get("/:userId/ongoing", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { userId } = req.params;
        // Retrieve ongoing matches for the user
        const onGoingMatches = yield ((_b = database_service_1.collections.matches) === null || _b === void 0 ? void 0 : _b.find({
            requesterId: new mongodb_1.ObjectId(userId),
            status: "pending",
        }).toArray());
        res.status(200).json(onGoingMatches);
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
// GET you might also like for a specific user
exports.userRouter.get("/:userId/like", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        // Aggregation pipeline to find ongoing matches and then populate with requester's name
        const pipeline = [
            {
                $match: {
                    status: "pending",
                    requesterId: { $ne: req.user._id },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "requesterId",
                    foreignField: "_id",
                    as: "requesterDetails",
                },
            },
            {
                $unwind: "$requesterDetails",
            },
            {
                $project: {
                    product_name: 1,
                    requesterId: 1,
                    created_date: 1,
                    "requesterDetails.first_name": 1,
                    "requesterDetails.last_name": 1,
                },
            },
            {
                $sort: { created_date: -1 },
            },
        ];
        // Retrieve recent matches for the user
        const mightLikeMatches = yield ((_c = database_service_1.collections.matches) === null || _c === void 0 ? void 0 : _c.aggregate(pipeline).toArray());
        res.status(200).json(mightLikeMatches);
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
