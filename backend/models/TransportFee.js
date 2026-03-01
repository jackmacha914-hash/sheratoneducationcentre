const mongoose = require('mongoose');

const transportFeeSchema = new mongoose.Schema({
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true,
        unique: true   // one fee per route
    },
    amount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('TransportFee', transportFeeSchema);
