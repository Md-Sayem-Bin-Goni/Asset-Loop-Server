import express from "express";
import {
  getFeaturedEquipments,
  getAllApprovedEquipments,
  getEquipmentById,
  createEquipment,
  getOwnerEquipments,
  updateEquipment,
  deleteEquipment,
  getAdminAllEquipments,
  updateEquipmentStatus,
} from "../controllers/equipmentController.js";
import { verifyToken, verifyOwner, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/featured", getFeaturedEquipments);
router.get("/", getAllApprovedEquipments);

// Owner Routes
router.get("/owner/my-equipments", verifyToken, verifyOwner, getOwnerEquipments);
router.post("/", verifyToken, verifyOwner, createEquipment);

// Admin Routes
router.get("/admin/all", verifyToken, verifyAdmin, getAdminAllEquipments);
router.patch("/:id/status", verifyToken, verifyAdmin, updateEquipmentStatus);

// Protected Shared Routes (Details, Update, Delete)
router.get("/:id", verifyToken, getEquipmentById);
router.put("/:id", verifyToken, updateEquipment);
router.delete("/:id", verifyToken, deleteEquipment);

export default router;