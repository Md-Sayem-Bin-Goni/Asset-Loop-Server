import express from "express";
import { createJwtAndSyncUser, getCurrentUserProfile } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/jwt", createJwtAndSyncUser);
router.get("/me", verifyToken, getCurrentUserProfile);

export default router;