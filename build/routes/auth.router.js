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
exports.authRouter = void 0;
// External Dependencies
const express_1 = __importDefault(require("express"));
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
const mongodb_1 = require("mongodb");
const express_validator_1 = require("express-validator");
const database_service_1 = require("../services/database.service");
// Global Config
exports.authRouter = express_1.default.Router();
// POST Register
const registerValidation = [
    (0, express_validator_1.body)("first_name")
        .notEmpty()
        .withMessage("First name is required.")
        .isLength({ max: 50 })
        .withMessage("First name must be less than 50 characters.")
        .isAlpha()
        .withMessage("First name must be alphabetic.")
        .trim()
        .escape()
        .toLowerCase(),
    (0, express_validator_1.body)("last_name")
        .notEmpty()
        .withMessage("Last name is required.")
        .isLength({ max: 50 })
        .withMessage("Last name must be less than 50 characters.")
        .isAlpha()
        .withMessage("Last name must be alphabetic.")
        .trim()
        .escape()
        .toLowerCase(),
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Enter a valid email address.")
        .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const query = { email: value };
        const user = yield ((_a = database_service_1.collections.users) === null || _a === void 0 ? void 0 : _a.findOne(query));
        if (user) {
            return Promise.reject("Email already in use");
        }
    }))
        .toLowerCase()
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long."),
    (0, express_validator_1.body)("postal_code")
        .matches(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/)
        .withMessage("Enter a valid postal code.")
        .trim()
        .escape()
        .toUpperCase(),
];
exports.authRouter.post("/register", registerValidation, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { first_name, last_name, email, password, postal_code, created_date, } = req.body;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ errors: errors.array() });
        }
        const newUser = {
            first_name,
            last_name,
            email,
            hashed_password: password,
            postal_code,
            created_date,
        };
        const hashedPassword = yield bcrypt.hash(req.body.password, 10);
        newUser.hashed_password = hashedPassword;
        newUser.created_date = new Date(newUser.created_date);
        const result = yield ((_b = database_service_1.collections.users) === null || _b === void 0 ? void 0 : _b.insertOne(newUser));
        result
            ? res
                .status(201)
                .send(`User registered successfully with id ${result.insertedId}`)
            : res.status(500).send("Failed to create a new user.");
    }
    catch (error) {
        console.log(error.errInfo.details.schemaRulesNotSatisfied);
        res.status(500).send("An unexpected error occurred");
    }
}));
// POST Login
const loginValidation = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Enter a valid email address."),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long."),
];
exports.authRouter.post("/login", loginValidation, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const { email, password } = req.body;
        const query = { email: email };
        const user = yield ((_c = database_service_1.collections.users) === null || _c === void 0 ? void 0 : _c.findOne(query));
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const passwordMatch = yield bcrypt.compare(password, user.hashed_password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        const refreshToken = crypto.randomBytes(64).toString("hex");
        const hashedRefreshToken = yield bcrypt.hash(refreshToken, 10);
        yield ((_d = database_service_1.collections.users) === null || _d === void 0 ? void 0 : _d.updateOne({ email: user.email }, { $set: { refreshToken: hashedRefreshToken } }));
        res.status(201).json({
            message: "Logged in successfully",
            token: token,
            refreshToken: refreshToken,
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        });
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
// POST Token
exports.authRouter.post("/token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const { refreshToken } = req.body;
        const user = yield findUserByRefreshToken(refreshToken);
        if (!user) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const newToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        const newRefreshToken = crypto.randomBytes(64).toString("hex");
        const hashedNewRefreshToken = yield bcrypt.hash(newRefreshToken, 10);
        yield ((_e = database_service_1.collections.users) === null || _e === void 0 ? void 0 : _e.updateOne({ email: user.email }, { $set: { refreshToken: hashedNewRefreshToken } }));
        res.status(201).json({
            message: "New access token generated",
            token: newToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
function findUserByRefreshToken(refreshToken) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield ((_a = database_service_1.collections.users) === null || _a === void 0 ? void 0 : _a.find().toArray());
        if (!users) {
            return null;
        }
        for (let user of users) {
            const isMatch = yield bcrypt.compare(refreshToken, user.refreshToken);
            if (isMatch) {
                return user;
            }
        }
        return null;
    });
}
exports.default = findUserByRefreshToken;
// GET Logout
exports.authRouter.get("/logout", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { refreshToken } = req.body;
        const isMatch = yield bcrypt.compare(refreshToken, user.refreshToken);
        if (!isMatch) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        user.refreshToken = null;
        res.status(201).json({ message: "User logged out successfully" });
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
// DELETE Profile
exports.authRouter.delete("/profile/:userId", passport.authenticate("jwt", { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const { userId } = req.params;
        const query = { _id: new mongodb_1.ObjectId(userId) };
        const result = yield ((_f = database_service_1.collections.users) === null || _f === void 0 ? void 0 : _f.deleteOne(query));
        if (result && result.deletedCount) {
            res.status(202).send(`Successfully removed user with id ${userId}`);
        }
        else if (!result) {
            res.status(400).send(`Failed to remove user with id ${userId}`);
        }
        else if (!result.deletedCount) {
            res.status(404).send(`User with id ${userId} does not exist`);
        }
    }
    catch (error) {
        res.status(500).send("An unexpected error occurred");
    }
}));
