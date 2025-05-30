const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  console.log(`Authenticating request for: ${req.method} ${req.path}`);
  console.log("Cookies:", req.cookies);
  console.log("Headers:", req.headers);

  // Check for token in cookies (primary method)
  let token = req.cookies.jwt;

  // Fallback to Authorization header
  if (!token && req.headers["authorization"]) {
    const authHeader = req.headers["authorization"];
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("Using Bearer token from Authorization header");
    }
  }

  if (!token) {
    console.log("No token provided in cookies or Authorization header");
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Token verified: user_id=${user.id}, role=${user.role}`);
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message, err.stack);
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: false,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = authenticate;