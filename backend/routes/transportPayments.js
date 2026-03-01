const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TransportPayment = require("../models/TransportPayment");
const Route = require("../models/Route"); // Route has transportfee field

// ---------------------------
// CREATE PAYMENT
// ---------------------------
router.post("/", async (req, res) => {
  try {
    const { studentId, routeId, amount, term, year, method } = req.body;

    // Validate required fields
    if (!studentId || !routeId || !amount || !term || !year || !method) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ error: "Invalid student or route ID" });
    }

    // Get route fee
    const route = await Route.findById(routeId);
    if (!route) return res.status(400).json({ error: "Route not found" });
    const transportFee = route.transportfee || 0;

    // Sum previous payments for this student, route, term, year
    const previousPayments = await TransportPayment.aggregate([
      {
        $match: {
          studentId: mongoose.Types.ObjectId(studentId),
          routeId: mongoose.Types.ObjectId(routeId),
          term,
          year
        }
      },
      { $group: { _id: null, totalPaid: { $sum: "$amount" } } }
    ]);

    const totalPaidBefore = previousPayments[0]?.totalPaid || 0;
    const newBalance = transportFee - (totalPaidBefore + Number(amount));
    let status = "Unpaid";
    if (newBalance <= 0) status = "Paid";
    else if (totalPaidBefore > 0 || Number(amount) > 0) status = "Partial";

    // Create payment
    const payment = await TransportPayment.create({
      studentId,
      routeId,
      amount: Number(amount),
      term,
      year: Number(year),
      method,
      balance: newBalance,
      status
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------
// GET PAYMENTS (with filters)
// ---------------------------
router.get("/", async (req, res) => {
  try {
    const { studentId, routeId, term, year } = req.query;

    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (routeId) filter.routeId = routeId;
    if (term) filter.term = term;
    if (year) filter.year = Number(year);

    const payments = await TransportPayment.find(filter).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error("GET PAYMENTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// DELETE PAYMENT
// ---------------------------
router.delete("/:id", async (req, res) => {
  try {
    await TransportPayment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
