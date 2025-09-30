import express from "express";
import {
  isAuthenticated,
  login,
  logout,
  register,
  resetPassword,
  sendResetPasswordOtp,
  sendVerifyAccountOtp,
  verifyAccount,
} from "../controllers/auth.controller.js";
import { userAuth } from "../middlewares/userAuth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/logout", logout);
authRouter.post("/send-verify-otp", userAuth, sendVerifyAccountOtp);
authRouter.post("/verify-account", userAuth, verifyAccount);
authRouter.get("/is-auth", userAuth, isAuthenticated);
authRouter.post("/send-reset-password-otp", userAuth, sendResetPasswordOtp);
authRouter.post("/reset-password", userAuth, resetPassword);

export default authRouter;
