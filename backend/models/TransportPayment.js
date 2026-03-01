const mongoose = require("mongoose");

const TransportPaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  term: {
    type: String,
    enum: ["Term 1", "Term 2", "Term 3"],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ["Cash", "Mpesa", "Bank Transfer"],
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ["Unpaid", "Partial", "Paid"],
    required: true,
    default: "Unpaid"
  }
}, { timestamps: true });

module.exports = mongoose.model("TransportPayment", TransportPaymentSchema);
