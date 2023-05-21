import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./infra/db.js";
import cors from "cors";
import { authenticationRoutes } from "./routes/authenticationRoutes.js";

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
mongoose.set("strictQuery", false);

//Connecting to the database.
connectDB();

//Authentication routes.
authenticationRoutes(app);

app.get("/", async (req, res) => {
  res.status(200).send({ message: "API is ready to go!" });
});

app.listen(PORT, () => {
  console.log(`API ready to use in -> http://localhost:${PORT}`);
});
