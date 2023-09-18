// External Dependencies
import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

// Global Variables
export const collections: { users?: mongoDB.Collection } = {};

// Initialize Connection
export async function connectToDatabase() {
  dotenv.config();

  if (!process.env.DB_CONN_STRING || !process.env.USERS_COLLECTION_NAME) {
    throw new Error("Required environment variables are missing!");
  }
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(
    process.env.DB_CONN_STRING
  );

  await client.connect();

  const db: mongoDB.Db = client.db(process.env.DB_NAME);

  await db.command({
    collMod: process.env.USERS_COLLECTION_NAME,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [
          "first_name",
          "last_name",
          "email",
          "hashed_password",
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
          created_date: {
            bsonType: "date",
            description: "'created_date' is required and is a date",
          },
        },
      },
    },
  });

  const usersCollection: mongoDB.Collection = db.collection(
    process.env.USERS_COLLECTION_NAME
  );

  collections.users = usersCollection;

  console.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${usersCollection.collectionName}`
  );
}