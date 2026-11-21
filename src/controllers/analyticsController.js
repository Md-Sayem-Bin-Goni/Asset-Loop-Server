import { getDB } from "../config/db.js";

// Helper to group monthly revenue/bookings
const buildMonthlyStats = (payments) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();

  const map = months.map((name, index) => ({
    month: name,
    monthIndex: index,
    bookings: 0,
    revenue: 0,
  }));

  payments.forEach((p) => {
    const date = new Date(p.paidAt || p.createdAt);
    if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
      const m = date.getMonth();
      map[m].bookings += 1;
      map[m].revenue += Number(p.amount || 0);
    }
  });

  return map.map(({ month, bookings, revenue }) => ({ month, bookings, revenue }));
};

// 1. Admin Dashboard Analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    const db = getDB();

    const [
      totalUsers,
      totalEquipment,
      pendingApprovals,
      totalBookings,
      completedRentals,
      payments,
    ] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("equipments").countDocuments(),
      db.collection("equipments").countDocuments({ status: "Pending" }),
      db.collection("bookings").countDocuments(),
      db.collection("bookings").countDocuments({ paymentStatus: "Paid" }),
      db.collection("payments").find({}).toArray(),
    ]);

    const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const monthlyStats = buildMonthlyStats(payments);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalEquipment,
        pendingApprovals,
        totalBookings,
        completedRentals,
        totalRevenue,
        monthlyStats,
      },
    });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to load admin analytics" });
  }
};

// 2. Owner Dashboard Analytics
export const getOwnerAnalytics = async (req, res) => {
  try {
    const db = getDB();
    const ownerEmail = req.user.email;

    const [totalListedEquipment, completedRentals, payments] = await Promise.all([
      db.collection("equipments").countDocuments({ "owner.email": ownerEmail }),
      db.collection("bookings").countDocuments({ ownerEmail, paymentStatus: "Paid" }),
      db.collection("payments").find({ ownerEmail }).toArray(),
    ]);

    const totalEarnings = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const monthlyStats = buildMonthlyStats(payments);

    res.status(200).json({
      success: true,
      stats: {
        totalListedEquipment,
        completedRentals,
        totalEarnings,
        monthlyStats,
      },
    });
  } catch (error) {
    console.error("Owner Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to load owner analytics" });
  }
};