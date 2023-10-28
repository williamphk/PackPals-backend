"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = exports.collections = void 0;
// External Dependencies
const mongoDB = __importStar(require("mongodb"));
const dotenv = __importStar(require("dotenv"));
// Global Variables
exports.collections = {};
// Initialize Connection
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        dotenv.config();
        if (!process.env.DB_CONN_STRING ||
            !process.env.USERS_COLLECTION_NAME ||
            !process.env.MATCHES_COLLECTION_NAME ||
            !process.env.NOTIFICATIONS_COLLECTION_NAME) {
            throw new Error("Required environment variables are missing!");
        }
        const client = new mongoDB.MongoClient(process.env.DB_CONN_STRING);
        yield client.connect();
        const db = client.db(process.env.DB_NAME);
        yield db.command({
            collMod: process.env.USERS_COLLECTION_NAME,
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: [
                        "first_name",
                        "last_name",
                        "email",
                        "hashed_password",
                        "postal_code",
                        "created_date",
                    ],
                    additionalProperties: false,
                    properties: {
                        _id: {},
                        first_name: {
                            bsonType: "string",
                            description: "'first_name' is required and is a string",
                        },
                        last_name: {
                            bsonType: "string",
                            description: "'last_name' is required and is a string",
                        },
                        email: {
                            bsonType: "string",
                            description: "'email' is required and is a string",
                        },
                        hashed_password: {
                            bsonType: "string",
                            description: "'password' is required and is a string",
                        },
                        postal_code: {
                            bsonType: "string",
                            description: "'postal_code' is required and is a string",
                        },
                        refreshToken: {
                            bsonType: "string",
                            description: "'refreshToken' is a string",
                        },
                        created_date: {
                            bsonType: "date",
                            description: "'created_date' is required and is a date",
                        },
                    },
                },
            },
        });
        yield db.command({
            collMod: process.env.MATCHES_COLLECTION_NAME,
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["product_name", "created_date", "requesterId", "status"],
                    additionalProperties: false,
                    properties: {
                        _id: {},
                        product_name: {
                            bsonType: "string",
                            description: "'product_name' is required and is a string",
                        },
                        created_date: {
                            bsonType: "date",
                            description: "'created_date' is required and is a date",
                        },
                        requesterId: {
                            bsonType: "objectId",
                            description: "'requester' is required and is a objectId",
                        },
                        requesteeId: {
                            bsonType: ["objectId", "null"],
                            description: "'requesteeId' is null or a objectId",
                        },
                        status: {
                            bsonType: "string",
                            description: "'status' is required and is a string",
                        },
                    },
                },
            },
        });
        yield db.command({
            collMod: process.env.NOTIFICATIONS_COLLECTION_NAME,
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["userId", "content", "seen", "created_date"],
                    additionalProperties: false,
                    properties: {
                        _id: {},
                        userId: {
                            bsonType: "objectId",
                            description: "'userId' is required and is a objectId",
                        },
                        content: {
                            bsonType: "string",
                            description: "'content' is required and is a string",
                        },
                        seen: {
                            bsonType: "bool",
                            description: "'seen' is required and is a boolean",
                        },
                        created_date: {
                            bsonType: "date",
                            description: "'created_date' is required and is a date",
                        },
                    },
                },
            },
        });
        const usersCollection = db.collection(process.env.USERS_COLLECTION_NAME);
        const matchesCollection = db.collection(process.env.MATCHES_COLLECTION_NAME);
        const notificationsCollection = db.collection(process.env.NOTIFICATIONS_COLLECTION_NAME);
        exports.collections.users = usersCollection;
        exports.collections.matches = matchesCollection;
        exports.collections.notifications = notificationsCollection;
        console.log(`Successfully connected to database: ${db.databaseName} and collection: ${usersCollection.collectionName} ${matchesCollection.collectionName} ${notificationsCollection.collectionName}`);
    });
}
exports.connectToDatabase = connectToDatabase;
