import express from "express";
import { addFavorite, getMyFavorites, removeFavorite } from "../controllers/favoriteController.js";
import { verifyToken, verifyCustomer } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, verifyCustomer, addFavorite);
router.get("/", verifyToken, verifyCustomer, getMyFavorites);
router.delete("/:id", verifyToken, verifyCustomer, removeFavorite);

export default router;