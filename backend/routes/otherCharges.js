// routes/otherCharges.js
const express = require("express");
const router = express.Router();
const OtherCharge = require("../models/OtherCharge");

// GET all charges or by class
router.get("/", async (req, res) => {
    const { className } = req.query;
    const query = className ? { className } : {};
    try {
        const charges = await OtherCharge.find(query).sort({ date: -1 });
        res.json(charges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
