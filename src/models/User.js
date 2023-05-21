import mongoose from "mongoose";
export const User = mongoose.model(
  "User",
  {
    name: String,
    lastName: String,
    age: {
      type: Number,
      integer: true,
    },
    gender: String,
    celphone: String,
    email: {
      type: String,
      unique: true,
    },
    photo: String,
    class: String,
  },
  "Users"
);
