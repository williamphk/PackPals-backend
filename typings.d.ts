import { User } from "./src/models/user"; // Adjust the import path
import { Server as SocketIoServer } from "socket.io";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

declare module "express-serve-static-core" {
  export interface Request {
    io: SocketIoServer;
  }
}
