const express = require('express');
const router = express.Router();

const TransportAttendance = require('../models/TransportAttendance');
const TransportAssignment = require('../models/TransportAssignment');


// ------------------------------------
// GET students for attendance (by route)
// ------------------------------------
router.get('/route/:routeId', async (req, res) => {
  try {
    const assignments = await TransportAssignment.find({
      routeId: req.params.routeId
    })
      .populate('studentId', 'name')
      .populate('routeId', 'name')
      .populate('busId', 'number');

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------
// SAVE attendance (bulk)
// ------------------------------------
router.post('/', async (req, res) => {
  const { date, routeId, records } = req.body;

  if (!date || !routeId || !records?.length) {
    return res.status(400).json({ message: 'Missing attendance data' });
  }

  try {
    const operations = records.map(r => ({
      updateOne: {
        filter: {
          studentId: r.studentId,
          routeId,
          date
        },
        update: {
          studentId: r.studentId,
          routeId,
          busId: r.busId,
          date,
          present: r.present
        },
        upsert: true
      }
    }));

    await TransportAttendance.bulkWrite(operations);

    res.json({ message: 'Attendance saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ------------------------------------
// GET attendance by date & route
// ------------------------------------
router.get('/', async (req, res) => {
  const { date, routeId } = req.query;

  try {
    const attendance = await TransportAttendance.find({
      ...(date && { date }),
      ...(routeId && { routeId })
    })
      .populate('studentId', 'name')
      .populate('routeId', 'name')
      .populate('busId', 'number');

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
