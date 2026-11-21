import express from "express";
import {
  createBookingAndCheckout,
  verifyStripePayment,
  getCustomerRentals,
  getOwnerEquipmentRentals,
  getAdminAllRentals,
} from "../controllers/bookingController.js";
import { verifyToken, verifyCustomer, verifyOwner, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/checkout", verifyToken, verifyCustomer, createBookingAndCheckout);
router.post("/verify-payment", verifyToken, verifyStripePayment);
router.get("/customer", verifyToken, verifyCustomer, getCustomerRentals);
router.get("/owner", verifyToken, verifyOwner, getOwnerEquipmentRentals);
router.get("/admin", verifyToken, verifyAdmin, getAdminAllRentals);

export default router;