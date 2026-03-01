// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number },
  genre: { type: String, required: true },
  className: { type: String, required: true },
  status: { type: String, default: 'available' },
  available: { type: Number, default: 1, min: 0 }
});

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
