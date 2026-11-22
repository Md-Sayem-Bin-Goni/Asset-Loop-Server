import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Update Logged-in User Profile
export const updateMyProfile = async (req, res) => {
  try {
    const db = getDB();
    const { name, phone, address, image } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (image !== undefined) updateFields.image = image;

    if (Object.keys(updateFields).length > 0) {
      await db.collection("users").updateOne(
        { email: req.user.email },
        { $set: updateFields }
      );
    }

    const updatedUser = await db.collection("users").findOne({ email: req.user.email });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// Admin: Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// Admin: Update User Role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["customer", "owner", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const db = getDB();
    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    res.status(200).json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
};

// Admin: Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};