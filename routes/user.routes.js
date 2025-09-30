import express from "express";
import { userAuth } from "../middlewares/userAuth.js";
import { getUserData } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/data", userAuth, getUserData);

export default userRouter;
