import mongoose from "mongoose";
export const User = mongoose.model(
  "User",
  {
    name: String,
    lastName: String,
    nickName: {
      type: String,
      unique: true,
    },
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
    password: String,
  },
  "Users"
);
