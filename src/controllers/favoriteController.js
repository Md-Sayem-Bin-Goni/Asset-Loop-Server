import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Add to Favorites
export const addFavorite = async (req, res) => {
  try {
    const { equipmentId } = req.body;
    const customerEmail = req.user.email;
    const db = getDB();

    const exists = await db.collection("favorites").findOne({ customerEmail, equipmentId });
    if (exists) {
      return res.status(400).json({ success: false, message: "Already added to favorites" });
    }

    const equipment = await db.collection("equipments").findOne({ _id: new ObjectId(equipmentId) });
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    const favoriteDoc = {
      customerEmail,
      equipmentId,
      equipmentName: equipment.name,
      category: equipment.category,
      rentalPrice: equipment.rentalPrice,
      rentalType: equipment.rentalType,
      image: equipment.image,
      location: equipment.location,
      createdAt: new Date().toISOString(),
    };

    await db.collection("favorites").insertOne(favoriteDoc);
    res.status(201).json({ success: true, message: "Added to favorites!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add favorite" });
  }
};

// Get Logged-in Customer's Favorites
export const getMyFavorites = async (req, res) => {
  try {
    const db = getDB();
    const favorites = await db
      .collection("favorites")
      .find({ customerEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch favorites" });
  }
};

// Remove from Favorites
export const removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    await db.collection("favorites").deleteOne({
      _id: new ObjectId(id),
      customerEmail: req.user.email,
    });
    res.status(200).json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove favorite" });
  }
};