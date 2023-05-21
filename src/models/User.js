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
    about: String,
    location: String,
    preference: {
      type: Array,
      items: {
        type: String,
      },
    },
    age: {
      type: Number,
      integer: true,
    },
    gender: String,
    phone: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    photos: {
      type: Array,
      items: {
        type: String,
      },
    },
    course: String,
    password: String,
  },
  "Users"
);
