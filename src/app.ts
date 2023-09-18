import express, { Application } from "express";
import { connectToDatabase } from "./services/database.service";
import { usersRouter } from "./routes/users.router";

const app: Application = express();

const PORT: number = 3001;

connectToDatabase()
  .then(() => {
    app.use("/users", usersRouter);

    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
    process.exit();
  });
