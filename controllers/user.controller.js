import { User } from "../models/user.model.js";

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      userData: {
        name: user.name,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    console.error("detching user error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
