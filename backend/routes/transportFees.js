const express = require('express');
const router = express.Router();
const TransportFee = require('../models/TransportFee');

// CREATE / UPDATE FEE
router.post('/', async (req, res) => {
    try {
        const { routeId, amount } = req.body;

        const fee = await TransportFee.findOneAndUpdate(
            { routeId },
            { amount },
            { new: true, upsert: true }
        );

        res.json(fee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ALL FEES
router.get('/', async (req, res) => {
    try {
        const fees = await TransportFee.find()
            .populate('routeId', 'name');
        res.json(fees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE FEE
router.delete('/:id', async (req, res) => {
    try {
        await TransportFee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Fee deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
