import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successful connection with the database");
  } catch (error) {
    console.error("Failed connection with the database:", error.message);
    process.exit(1); // Exit the application if it cannot connect to the database
  }
};
