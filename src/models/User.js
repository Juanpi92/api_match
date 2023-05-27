import mongoose from "mongoose";
export const User = mongoose.model(
  "User",
  {
    name: { type: String, default: "default value" },
    lastName: { type: String, default: "default value" },
    about: { type: String, default: "default value" },
    location: { type: String, default: "default value" },
    preference: {
      type: Array,
      default: "heterosexual",
      items: {
        type: String,
      },
    },
    gender: { type: String, default: "heterosexual" },
    phone: {
      type: String,
      default: "default value",
      unique: true,
    },
    email: {
      type: String,
      default: "default value",
      unique: true,
    },
    photos: {
      type: Array,
      default: [""],
      items: {
        type: String,
      },
    },
    course: { type: String, default: "UVA" },
    password: {
      String,
      default: "default value",
    },
    complete_register: { type: Boolean, default: false },
  },
  "Users"
);
