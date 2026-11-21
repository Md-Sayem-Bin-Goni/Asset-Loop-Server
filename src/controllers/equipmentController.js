import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// 1. Get 6 Featured Approved Equipment (Home Page)
export const getFeaturedEquipments = async (req, res) => {
  try {
    const db = getDB();
    const equipments = await db
      .collection("equipments")
      .find({ status: "Approved" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.status(200).json({ success: true, equipments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch featured equipment" });
  }
};

// 2. Get All Approved Equipment with Server-Side Search, Filter, Sort & Pagination
export const getAllApprovedEquipments = async (req, res) => {
  try {
    const db = getDB();
    const {
      search = "",
      category = "",
      rentalType = "",
      minPrice = "",
      maxPrice = "",
      availability = "",
      sort = "recent",
      page = 1,
      limit = 9,
    } = req.query;

    const query = { status: "Approved" };

    // Search by Equipment Name or Location (or Category)
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (rentalType && rentalType !== "All") {
      query.rentalType = rentalType;
    }

    if (minPrice || maxPrice) {
      query.rentalPrice = {};
      if (minPrice) query.rentalPrice.$gte = Number(minPrice);
      if (maxPrice) query.rentalPrice.$lte = Number(maxPrice);
    }

    if (availability === "available") {
      query.availableQuantity = { $gt: 0 };
    } else if (availability === "unavailable") {
      query.availableQuantity = { $lte: 0 };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { rentalPrice: 1 };
    if (sort === "price_desc") sortOption = { rentalPrice: -1 };
    if (sort === "recent") sortOption = { createdAt: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const equipmentsCollection = db.collection("equipments");
    const total = await equipmentsCollection.countDocuments(query);
    const equipments = await equipmentsCollection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    res.status(200).json({
      success: true,
      equipments,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Error fetching equipments:", error);
    res.status(500).json({ success: false, message: "Failed to fetch equipment list" });
  }
};

// 3. Get Single Equipment by ID (Private Route)
export const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid equipment ID" });
    }

    const db = getDB();
    const equipment = await db.collection("equipments").findOne({ _id: new ObjectId(id) });

    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    res.status(200).json({ success: true, equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch equipment details" });
  }
};

// 4. Owner: Add New Equipment (Default status: Pending)
export const createEquipment = async (req, res) => {
  try {
    const db = getDB();
    const {
      name,
      description,
      category,
      location,
      rentalPrice,
      rentalType,
      availableQuantity,
      condition,
      brand,
      model,
      image,
      terms,
    } = req.body;

    const newEquipment = {
      name,
      description,
      category,
      location,
      rentalPrice: Number(rentalPrice),
      rentalType,
      availableQuantity: Number(availableQuantity),
      condition,
      brand,
      model,
      image,
      terms,
      status: "Pending", // Always starts as Pending for Admin approval
      owner: {
        name: req.dbUser.name,
        email: req.dbUser.email,
        image: req.dbUser.image || "",
      },
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("equipments").insertOne(newEquipment);
    res.status(201).json({
      success: true,
      message: "Equipment submitted! Waiting for Admin approval.",
      equipment: { _id: result.insertedId, ...newEquipment },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add equipment" });
  }
};

// 5. Owner: Get My Listed Equipment
export const getOwnerEquipments = async (req, res) => {
  try {
    const db = getDB();
    const equipments = await db
      .collection("equipments")
      .find({ "owner.email": req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, equipments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch owner equipment" });
  }
};

// 6. Owner or Admin: Update Equipment
export const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid equipment ID" });
    }

    const db = getDB();
    const existing = await db.collection("equipments").findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    const currentUser = await db.collection("users").findOne({ email: req.user.email });
    if (currentUser.role !== "admin" && existing.owner.email !== req.user.email) {
      return res.status(403).json({ success: false, message: "Forbidden: Not authorized to update this item" });
    }

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.owner;
    if (updateData.rentalPrice !== undefined) updateData.rentalPrice = Number(updateData.rentalPrice);
    if (updateData.availableQuantity !== undefined) updateData.availableQuantity = Number(updateData.availableQuantity);

    await db.collection("equipments").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.status(200).json({ success: true, message: "Equipment updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update equipment" });
  }
};

// 7. Owner or Admin: Delete Equipment
export const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid equipment ID" });
    }

    const db = getDB();
    const existing = await db.collection("equipments").findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    const currentUser = await db.collection("users").findOne({ email: req.user.email });
    if (currentUser.role !== "admin" && existing.owner.email !== req.user.email) {
      return res.status(403).json({ success: false, message: "Forbidden: Not authorized to delete this item" });
    }

    await db.collection("equipments").deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ success: true, message: "Equipment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete equipment" });
  }
};

// 8. Admin: Get All Equipment (Pending, Approved, Rejected)
export const getAdminAllEquipments = async (req, res) => {
  try {
    const db = getDB();
    const equipments = await db
      .collection("equipments")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, equipments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch all equipment" });
  }
};

// 9. Admin: Approve or Reject Equipment Status
export const updateEquipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "Approved" | "Rejected" | "Pending"

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const db = getDB();
    await db.collection("equipments").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    res.status(200).json({ success: true, message: `Equipment marked as ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update equipment status" });
  }
};