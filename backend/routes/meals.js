// routes/meals.js
const express = require("express");
const router = express.Router();
const Meal = require("../models/Meal"); // MongoDB model

// GET all meals or by class
router.get("/", async (req, res) => {
    const { className } = req.query; // optional
    const query = className ? { className } : {};
    try {
        const meals = await Meal.find(query).sort({ date: -1 });
        res.json(meals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
