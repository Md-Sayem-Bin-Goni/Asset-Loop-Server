import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000"].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Root Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    platform: "AssetLoop",
    message: "AssetLoop Equipment Rental Server is running smoothly!",
  });
});

// Start Server after DB Connection
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`🚀 AssetLoop Server listening on port ${port}`);
  });
};

startServer();