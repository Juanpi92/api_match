import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./infra/db.js";
import cors from "cors";

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

//Connecting to db
connectDB();

app.get("/", async (req, res) => {
  res.status(200).send({ message: "Api is going" });
});

app.listen(PORT, () => {
  console.log(`API ready to use in http://localhost:${PORT}`);
});
