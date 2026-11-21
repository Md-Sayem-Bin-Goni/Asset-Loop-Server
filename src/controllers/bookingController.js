import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { getDB } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// 1. Create Booking & Stripe Checkout Session
export const createBookingAndCheckout = async (req, res) => {
  try {
    const {
      equipmentId,
      startDate,
      endDate,
      requiredQuantity,
      contactNumber,
      deliveryAddress,
      notes,
      totalAmount,
    } = req.body;

    const db = getDB();
    const equipment = await db.collection("equipments").findOne({ _id: new ObjectId(equipmentId) });

    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    const qty = Number(requiredQuantity);
    if (qty < 1 || qty > equipment.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${equipment.availableQuantity} unit(s) available right now.`,
      });
    }

    const customer = await db.collection("users").findOne({ email: req.user.email });

    // Create initial Unpaid booking record
    const newBooking = {
      equipmentId: equipment._id.toString(),
      equipmentName: equipment.name,
      equipmentImage: equipment.image,
      category: equipment.category,
      ownerEmail: equipment.owner.email,
      ownerName: equipment.owner.name,
      customerEmail: customer.email,
      customerName: customer.name,
      contactNumber,
      deliveryAddress,
      notes: notes || "",
      startDate,
      endDate,
      requiredQuantity: qty,
      totalAmount: Number(totalAmount),
      paymentStatus: "Unpaid",
      bookingStatus: "Pending",
      bookingDate: new Date().toISOString(),
    };

    const bookingResult = await db.collection("bookings").insertOne(newBooking);
    const bookingId = bookingResult.insertedId.toString();

    // Create Stripe Checkout Session
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customer.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${equipment.name} (${qty} unit)`,
              description: `Rental: ${startDate} to ${endDate}`,
            },
            unit_amount: Math.round(Number(totalAmount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        equipmentId: equipment._id.toString(),
        requiredQuantity: qty.toString(),
        customerEmail: customer.email,
        ownerEmail: equipment.owner.email,
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${clientUrl}/equipment/${equipmentId}?payment=cancelled`,
    });

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      bookingId,
    });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to initiate payment" });
  }
};

// 2. Verify Stripe Session & Record Payment
export const verifyStripePayment = async (req, res) => {
  try {
    const { sessionId, bookingId } = req.body;
    const db = getDB();

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(bookingId) });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Prevent duplicate processing on page reload
    if (booking.paymentStatus !== "Paid") {
      await db.collection("bookings").updateOne(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            paymentStatus: "Paid",
            bookingStatus: "Confirmed",
            transactionId: session.payment_intent,
          },
        }
      );

      // Deduct available quantity from equipment
      await db.collection("equipments").updateOne(
        { _id: new ObjectId(booking.equipmentId) },
        { $inc: { availableQuantity: -booking.requiredQuantity } }
      );

      // Save transaction in payments collection
      await db.collection("payments").insertOne({
        bookingId,
        equipmentId: booking.equipmentId,
        equipmentName: booking.equipmentName,
        customerEmail: booking.customerEmail,
        ownerEmail: booking.ownerEmail,
        amount: booking.totalAmount,
        transactionId: session.payment_intent,
        stripeSessionId: sessionId,
        paidAt: new Date().toISOString(),
      });
    }

    const updatedBooking = await db.collection("bookings").findOne({ _id: new ObjectId(bookingId) });
    res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

// 3. Customer: Get My Rentals
export const getCustomerRentals = async (req, res) => {
  try {
    const db = getDB();
    const rentals = await db
      .collection("bookings")
      .find({ customerEmail: req.user.email })
      .sort({ bookingDate: -1 })
      .toArray();
    res.status(200).json({ success: true, rentals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch customer rentals" });
  }
};

// 4. Owner: Get Rentals for My Equipment
export const getOwnerEquipmentRentals = async (req, res) => {
  try {
    const db = getDB();
    const rentals = await db
      .collection("bookings")
      .find({ ownerEmail: req.user.email })
      .sort({ bookingDate: -1 })
      .toArray();
    res.status(200).json({ success: true, rentals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch owner rentals" });
  }
};

// 5. Admin: Get All Rentals
export const getAdminAllRentals = async (req, res) => {
  try {
    const db = getDB();
    const rentals = await db
      .collection("bookings")
      .find({})
      .sort({ bookingDate: -1 })
      .toArray();
    res.status(200).json({ success: true, rentals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch all rentals" });
  }
};