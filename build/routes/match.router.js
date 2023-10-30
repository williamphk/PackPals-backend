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
exports.matchRouter = void 0;
// External Dependencies
const express_1 = __importDefault(require("express"));
const passport = require("passport");
const mongodb_1 = require("mongodb");
const express_validator_1 = require("express-validator");
const database_service_1 = require("../services/database.service");
const match_1 = __importDefault(require("../models/match"));
const notification_1 = __importDefault(require("../models/notification"));
// Global Config
exports.matchRouter = express_1.default.Router();
// GET list of matches with keyword
exports.matchRouter.get("/:keyword", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { keyword } = req.params;
        //console.log(keyword);
        // Aggregation pipeline to find matches and then populate with requester's name
        const pipeline = [
            {
                $match: {
                    product_name: { $regex: keyword, $options: "i" },
                    requesterId: { $ne: req.user._id },
                    status: "pending",
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
                    "requesterDetails.first_name": 1,
                    "requesterDetails.last_name": 1,
                    "requesterDetails.postal_code": 1,
                },
            },
            {
                $sort: { created_date: -1 },
            },
        ];
        const matches = yield ((_a = database_service_1.collections.matches) === null || _a === void 0 ? void 0 : _a.aggregate(pipeline).toArray());
        matches && matches.length > 0
            ? res.status(201).send(matches)
            : res
                .status(200)
                .send("No matches found currently. Don't worry! You can host a match below!");
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
// GET user profile and the matched products
exports.matchRouter.get("/:matchId", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { matchId } = req.params;
        // Aggregation pipeline to find specific match and then populate with requester's name
        const pipeline = [
            {
                $match: {
                    _id: new mongodb_1.ObjectId(matchId),
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
                    productName: 1,
                    "requesterDetails.first_name": 1,
                    "requesterDetails.last_name": 1,
                },
            },
        ];
        const matchWithUserDetails = yield ((_b = database_service_1.collections.matches) === null || _b === void 0 ? void 0 : _b.aggregate(pipeline).next());
        matchWithUserDetails
            ? res.status(200).json(matchWithUserDetails)
            : res.status(404).json({ message: "Match not found" });
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
// POST accept match
exports.matchRouter.post("/:matchId/accept", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f;
    try {
        const { matchId } = req.params;
        const userId = req.user._id;
        const query = { _id: new mongodb_1.ObjectId(matchId) };
        const match = yield ((_c = database_service_1.collections.matches) === null || _c === void 0 ? void 0 : _c.findOne(query));
        const user = yield ((_d = database_service_1.collections.users) === null || _d === void 0 ? void 0 : _d.findOne({ _id: userId }));
        // Check if the match is created by the user
        if (match === null || match === void 0 ? void 0 : match.requesterId.equals(userId)) {
            return res
                .status(400)
                .json({ message: "You cannot accept your own match request" });
        }
        // Check if the match accepted
        if ((match === null || match === void 0 ? void 0 : match.status) === "accepted") {
            return res.status(400).json({ message: "Match already accepted" });
        }
        // Update the match status to accepted
        const result = yield ((_e = database_service_1.collections.matches) === null || _e === void 0 ? void 0 : _e.updateOne(query, {
            $set: { status: "accepted", requesteeId: req.user._id },
        }));
        if (result === null || result === void 0 ? void 0 : result.modifiedCount) {
            const notification = new notification_1.default(match === null || match === void 0 ? void 0 : match.requesterId, `Your ${match === null || match === void 0 ? void 0 : match.product_name}'s match request has been accepted by ${user === null || user === void 0 ? void 0 : user.first_name} ${user === null || user === void 0 ? void 0 : user.last_name}!`, false, new Date());
            // Store the notification in the database
            yield ((_f = database_service_1.collections.notifications) === null || _f === void 0 ? void 0 : _f.insertOne(notification));
            // Emit the event for the match being accepted
            req.socketServer
                .to(match === null || match === void 0 ? void 0 : match.requesterId.toString())
                .emit("notification", {
                message: `Your ${match === null || match === void 0 ? void 0 : match.product_name}'s match request has been accepted by ${user === null || user === void 0 ? void 0 : user.first_name} ${user === null || user === void 0 ? void 0 : user.last_name}!`,
            });
            res
                .status(201)
                .json({ message: "Match request accepted successfully" });
        }
        else {
            res.status(500).json({ message: "Failed to accept match request" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send("An unexpected error occurred");
    }
}));
// POST matches
const matchValidation = [
    (0, express_validator_1.body)("productName")
        .not()
        .isEmpty()
        .withMessage("Product name is required")
        .trim()
        .escape(),
];
exports.matchRouter.post("/", passport.authenticate("jwt", { session: false }), matchValidation, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const { product_name } = req.body;
        const requester = req.user._id;
        // Create a new match object
        const newMatch = new match_1.default(product_name, new Date(), requester, "pending");
        // Store the match request in the database
        const result = yield ((_g = database_service_1.collections.matches) === null || _g === void 0 ? void 0 : _g.insertOne(newMatch));
        (result === null || result === void 0 ? void 0 : result.acknowledged)
            ? res.status(201).json({
                message: "Match request created successfully",
                matchId: result.insertedId,
            })
            : res
                .status(500)
                .json({ message: "Failed to create a match request." });
    }
    catch (error) {
        console.log(error.errInfo.details.schemaRulesNotSatisfied[0]
            .propertiesNotSatisfied[0]);
        res.status(500).send("An unexpected error occurred");
    }
}));
// DELETE match
exports.matchRouter.delete("/:matchId", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j;
    try {
        const { matchId } = req.params;
        const requester = req.user._id;
        const query = { _id: new mongodb_1.ObjectId(matchId) };
        const match = yield ((_h = database_service_1.collections.matches) === null || _h === void 0 ? void 0 : _h.findOne(query));
        // Check if the match is created by the user
        if (!(match === null || match === void 0 ? void 0 : match.requesterId.equals(requester))) {
            return res
                .status(400)
                .json({ message: "You cannot delete someone else's match request" });
        }
        // Check if the match is already accepted
        if ((match === null || match === void 0 ? void 0 : match.status) === "accepted") {
            return res
                .status(400)
                .json({ message: "You cannot delete an accepted match request" });
        }
        // Delete the match request
        const result = yield ((_j = database_service_1.collections.matches) === null || _j === void 0 ? void 0 : _j.deleteOne(query));
        (result === null || result === void 0 ? void 0 : result.deletedCount)
            ? res
                .status(200)
                .json({ message: "Match request deleted successfully" })
            : res.status(500).json({ message: "Failed to delete match request" });
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
