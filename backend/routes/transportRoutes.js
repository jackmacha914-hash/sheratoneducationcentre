const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// --------------------
// SCHEMAS
// --------------------

// Bus Schema
const busSchema = new mongoose.Schema({
    number: String,
    plate: String,
    capacity: Number,
    status: { type: String, default: "Active" }
});
const Bus = mongoose.model('Bus', busSchema);

// Route Schema
const routeSchema = new mongoose.Schema({
    name: String,
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }
});
const Route = mongoose.model('Route', routeSchema);

// Driver Schema
const driverSchema = new mongoose.Schema({
    name: String,
    license: String,
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }
});
const Driver = mongoose.model('Driver', driverSchema);

// Student Transport Assignment
const studentTransportSchema = new mongoose.Schema({
    studentId: String,
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }
});
const StudentTransport = mongoose.model('StudentTransport', studentTransportSchema);

// --------------------
// BUS ROUTES
// --------------------
router.get('/buses', async (req, res) => {
    const buses = await Bus.find();
    res.json(buses);
});

router.post('/buses', async (req, res) => {
    const bus = new Bus(req.body);
    await bus.save();
    res.json(bus);
});

router.put('/buses/:id', async (req, res) => {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(bus);
});

router.delete('/buses/:id', async (req, res) => {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted' });
});

// --------------------
// ROUTE ROUTES
// --------------------
router.get('/routes', async (req, res) => {
    const routes = await Route.find().populate('busId');
    res.json(routes);
});

router.post('/routes', async (req, res) => {
    const route = new Route(req.body);
    await route.save();
    res.json(route);
});

router.put('/routes/:id', async (req, res) => {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(route);
});

router.delete('/routes/:id', async (req, res) => {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted' });
});

// --------------------
// DRIVER ROUTES
// --------------------
router.get('/drivers', async (req, res) => {
    const drivers = await Driver.find().populate('busId');
    res.json(drivers);
});

router.post('/drivers', async (req, res) => {
    const driver = new Driver(req.body);
    await driver.save();
    res.json(driver);
});

router.put('/drivers/:id', async (req, res) => {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(driver);
});

router.delete('/drivers/:id', async (req, res) => {
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ message: 'Driver deleted' });
});

// --------------------
// STUDENT TRANSPORT ASSIGNMENTS
// --------------------
router.get('/assignments', async (req, res) => {
    const assignments = await StudentTransport.find().populate('busId routeId');
    res.json(assignments);
});

router.post('/assignments', async (req, res) => {
    const assignment = new StudentTransport(req.body);
    await assignment.save();
    res.json(assignment);
});

router.delete('/assignments/:id', async (req, res) => {
    await StudentTransport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted' });
});
// --------------------
// TRANSPORT PAYMENTS (Schema-less)
// --------------------
const transportPaymentsCollection = mongoose.connection.collection('transportpayments');

// CREATE payment
router.post('/payments', async (req, res) => {
  try {
    const data = { ...req.body, createdAt: new Date() }; // add createdAt for sorting
    const result = await transportPaymentsCollection.insertOne(data);
    res.status(201).json(result.ops[0] || data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET payments with optional filters
router.get('/payments', async (req, res) => {
  try {
    const { term, year, studentId, routeId } = req.query;
    const filter = {};
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year);
    if (studentId) filter.studentId = studentId;
    if (routeId) filter.routeId = routeId;

    const payments = await transportPaymentsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await transportPaymentsCollection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
