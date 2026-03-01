// models/Bus.js
const mongoose = require('mongoose');
const BusSchema = new mongoose.Schema({
  number: { type: String, required: true },
  plate: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Maintenance'], default: 'Active' }
});
module.exports = mongoose.model('Bus', BusSchema);
