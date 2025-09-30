import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import transporter from "../configs/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All inputs are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to Our App 🎉",
      text: `Hi ${name},\n\nWelcome to our app! Your account has been created successfully with the email: ${email}.\n\nWe’re excited to have you join us.\n\n- The Team`,
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border-radius: 10px; background: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
      <h1 style="color: #4f46e5; margin: 0;">Welcome, ${name}! 🎉</h1>
    </div>
    <div style="padding: 20px 0; color: #333; line-height: 1.6;">
      <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
      <p>We're excited to let you know that your account has been created successfully with the email:</p>
      <p style="font-size: 18px; font-weight: bold; color: #4f46e5;">${email}</p>
      <p>Get ready to explore all the awesome features we’ve built for you!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${
          process.env.CLIENT_URL || "http://localhost:3000/"
        }/login" style="display: inline-block; padding: 12px 25px; font-size: 16px; color: #fff; background: #4f46e5; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Go to Dashboard
        </a>
      </div>
      <p>If you did not create this account, please ignore this email or <a href="${
        process.env.CLIENT_URL || "http://localhost:3000/"
      }/support" style="color: #4f46e5; text-decoration: none;">contact support</a>.</p>
    </div>
    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
      <p>© ${new Date().getFullYear()} Our App. All rights reserved.</p>
    </div>
  </div>
  `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email error:", error.message);
    }

    return res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
  } catch (error) {
    console.error("Register error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All inputs are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: "User logged in successfully",
      });
  } catch (error) {
    console.error("Login error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const sendVerifyAccountOtp = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res
        .status(409)
        .json({ success: false, message: "Account already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpiresAt = Date.now() + 60 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify Your Account - OTP",
      text: `Hi ${user.name},\n\nYour OTP for account verification is: ${otp}\nThis OTP will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\n- The Team`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:10px;">
          <h2 style="color:#333;">Verify Your Account</h2>
          <p style="color:#555;">Hi <b>${user.name}</b>,</p>
          <p style="color:#555;">Use the OTP below to verify your account. It will expire in <b>1 hour</b>:</p>
          <div style="font-size:24px;font-weight:bold;color:#2c3e50;background:#eee;padding:10px;border-radius:5px;text-align:center;letter-spacing:3px;">
            ${otp}
          </div>
          <p style="color:#555;margin-top:20px;">If you didn’t request this, please ignore this email.</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;" />
          <p style="font-size:13px;color:#777;">© ${new Date().getFullYear()} Your App. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send verify OTP error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const verifyAccount = async (req, res) => {
  const { userId } = req.user;
  const { otp } = req.body;

  if (!userId || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "All inputs are required" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res
        .status(409)
        .json({ success: false, message: "Account already verified" });
    }

    if (Date.now() > user.verifyOtpExpiresAt) {
      user.verifyOtp = "";
      user.verifyOtpExpiresAt = 0;
      await user.save();
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpiresAt = 0;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("verify OTP error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Is authenticated error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const sendResetPasswordOtp = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "All inputs are required" });

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpiresAt = Date.now() + 60 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset - OTP",
      text: `Hi ${user.name},

You requested to reset your password. Your OTP is: ${otp}
This OTP will expire in 1 hour.

If you did not request a password reset, please ignore this email.

- The Team`,
      html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:10px;">
      <h2 style="color:#333;">Password Reset Request</h2>
      <p style="color:#555;">Hi <b>${user.name}</b>,</p>
      <p style="color:#555;">
        You requested to reset your password. Use the OTP below to proceed. 
        This code will expire in <b>1 hour</b>:
      </p>
      <div style="font-size:24px;font-weight:bold;color:#2c3e50;background:#eee;padding:10px;border-radius:5px;text-align:center;letter-spacing:3px;">
        ${otp}
      </div>
      <p style="color:#555;margin-top:20px;">
        If you didn’t request a password reset, you can safely ignore this email.
      </p>
      <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;" />
      <p style="font-size:13px;color:#777;">© ${new Date().getFullYear()} Your App. All rights reserved.</p>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("send password reset otp error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword)
    return res
      .status(400)
      .json({ success: false, message: "All inputs are required" });

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ success: false, message: "No user found" });

    if (user.resetOtpExpiresAt < Date.now())
      return res
        .status(400)
        .json({ success: false, message: "Otp session expired" });

    if (user.resetOtp === "" || otp !== user.resetOtp)
      return res
        .status(400)
        .json({ success: false, message: "Otp is invalid" });

    user.password = newPassword;
    user.resetOtp = "";
    user.resetOtpExpiresAt = 0;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("password reset error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
