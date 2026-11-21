import express from "express";
import { getAdminAnalytics, getOwnerAnalytics } from "../controllers/analyticsController.js";
import { verifyToken, verifyAdmin, verifyOwner } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/admin", verifyToken, verifyAdmin, getAdminAnalytics);
router.get("/owner", verifyToken, verifyOwner, getOwnerAnalytics);

export default router;