import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";

// Sync user to MongoDB & Issue JWT Token
export const createJwtAndSyncUser = async (req, res) => {
  try {
    const { name, email, image, phone, address } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    let existingUser = await usersCollection.findOne({ email });

    if (!existingUser) {
      // New user defaults to "customer" role per requirement
      const newUser = {
        name: name || email.split("@")[0],
        email,
        image: image || "",
        role: "customer",
        phone: phone || "",
        address: address || "",
        createdAt: new Date().toISOString(),
      };
      const result = await usersCollection.insertOne(newUser);
      existingUser = { _id: result.insertedId, ...newUser };
    } else {
      // Update missing profile info if provided on login (only if not already set)
      const updateFields = {};
      if (!existingUser.name && name) updateFields.name = name;
      if (!existingUser.image && image) updateFields.image = image;
      if (Object.keys(updateFields).length > 0) {
        await usersCollection.updateOne({ email }, { $set: updateFields });
        existingUser = await usersCollection.findOne({ email });
      }
    }

    const token = jwt.sign(
      { email: existingUser.email, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      user: existingUser,
    });
  } catch (error) {
    console.error("JWT & User Sync Error:", error);
    res.status(500).json({ success: false, message: "Failed to authenticate user" });
  }
};

// Get current logged-in user's full profile & role from DB
export const getCurrentUserProfile = async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
};