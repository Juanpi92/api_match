import mongoose from "mongoose";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Connection with mongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successful connection with the database!");
  } catch (error) {
    console.error("Failed to connect with the database:", error.message);
    process.exit(1); // Exit the application if it cannot connect to the database
  }
};

// Connection with sqlite
export async function sqliteConnection() {
  return open({
    filename: "./src/database/database.db",
    driver: sqlite3.Database,
  });
}
