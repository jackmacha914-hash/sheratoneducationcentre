const mongoose = require('mongoose');

const transportAssignmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TransportRoute',
        required: true
    },
    bus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model(
    'TransportAssignment',
    transportAssignmentSchema
);
