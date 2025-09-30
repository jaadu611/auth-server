import jwt from "jsonwebtoken";

export const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { userId: decoded.id };
    next();
  } catch (error) {
    console.error("user auth error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid or expired token",
    });
  }
};
