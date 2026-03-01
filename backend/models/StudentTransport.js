// models/StudentTransport.js
const mongoose = require('mongoose');
const StudentTransportSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' }
});
module.exports = mongoose.model('StudentTransport', StudentTransportSchema);
