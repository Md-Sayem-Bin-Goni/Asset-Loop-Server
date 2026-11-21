import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";

// 1. Verify JWT Token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access: No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access: Invalid or expired token",
      });
    }
    req.user = decoded; // { email }
    next();
  });
};

// Helper to fetch user role from MongoDB
const checkRole = (requiredRole) => async (req, res, next) => {
  try {
    const db = getDB();
    const email = req.user?.email;
    const user = await db.collection("users").findOne({ email });

    if (!user || user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires ${requiredRole} privileges`,
      });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server role verification error" });
  }
};

// 2. Role-Based Middlewares
export const verifyCustomer = checkRole("customer");
export const verifyOwner = checkRole("owner");
export const verifyAdmin = checkRole("admin");