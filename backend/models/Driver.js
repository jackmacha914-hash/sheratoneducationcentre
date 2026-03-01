// models/Driver.js
const mongoose = require('mongoose');
const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  license: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }
});
module.exports = mongoose.model('Driver', DriverSchema);
