const mongoose = require('mongoose');

const transportAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportRoute',
      required: true
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportBus'
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    present: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* Prevent duplicate attendance per student per day per route */
transportAttendanceSchema.index(
  { studentId: 1, routeId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('TransportAttendance', transportAttendanceSchema);
