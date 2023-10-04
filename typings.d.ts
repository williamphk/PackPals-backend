import { User } from "./src/models/user"; // Adjust the import path

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
