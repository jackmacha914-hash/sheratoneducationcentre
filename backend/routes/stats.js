const express = require('express');
const router = express.Router();

// Models
const User = require('../models/User');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Attendance = require('../models/Attendance');
const Book = require('../models/Book');
const Fee = require('../models/Fee');

router.get('/', async (req, res) => {
  try {
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const events = await Event.countDocuments();
    const clubs = await Club.countDocuments();

    const present = await Attendance.countDocuments({ status: 'present' });
    const absent = await Attendance.countDocuments({ status: 'absent' });

    const issued = await Book.countDocuments({ status: 'issued' });

    const feesAgg = await Fee.aggregate([
      {
        $group: {
          _id: null,
          paid: { $sum: '$paidAmount' },
          balance: { $sum: '$balance' }
        }
      }
    ]);

    const paid = feesAgg[0]?.paid || 0;
    const balance = feesAgg[0]?.balance || 0;

    res.json({
      students,
      teachers,
      events,
      clubs,
      attendance: { present, absent },
      library: { issued },
      fees: { paid, balance }
    });

  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

module.exports = router;
