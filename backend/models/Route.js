// models/Route.js
const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }
});

// ✅ Use existing model if already compiled
module.exports = mongoose.models.Route || mongoose.model('Route', RouteSchema);
