import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Allowed CORS Origins
const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ""),
  "https://asset-loop-client.vercel.app",
  "http://localhost:3000",
].filter(Boolean);

// Middlewares
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Ensure MongoDB is connected on every serverless invocation
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(503).json({
      success: false,
      message: "Database connection unavailable. Please try again shortly.",
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/analytics", analyticsRoutes);

// Root Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    platform: "AssetLoop",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    message: "AssetLoop Equipment Rental Server is running smoothly!",
  });
});

// 404 Route Handler for Unknown API Endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Local Server (Vercel uses the exported app directly)
const startServer = async () => {
  try {
    await connectDB();
    if (!process.env.VERCEL) {
      app.listen(port, () => {
        console.log(`🚀 AssetLoop Server listening on port ${port}`);
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

export default app;