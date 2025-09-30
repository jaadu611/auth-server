import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("mongodb connected");
    });
    await mongoose.connect(`${process.env.MONGODB_URI}/auth`);
  } catch (error) {
    console.error(error.message);
  }
};
