// routes/books.js
const express = require('express');
const Book = require('../models/Book');
const router = express.Router();

// Get all books with advanced filtering support
router.get('/', async (req, res) => {
    try {
        const { search, genre, author, year, status } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (genre) filter.genre = genre;
        if (author) filter.author = { $regex: author, $options: 'i' };
        if (year) filter.year = year;
        if (status) filter.status = status;

        const books = await Book.find(filter);
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new book
router.post('/', async (req, res) => {
    console.log('Received book data:', req.body); // Add this for debugging
    
    const { title, author, year, genre, status, className, available } = req.body;
    
    // Validate required fields
    if (!title || !author || !genre || !className) {
        console.error('Missing required fields:', { title, author, genre, className });
        return res.status(400).json({ 
            success: false,
            message: 'Title, author, genre, and class are required' 
        });
    }

    try {
        const book = new Book({ 
            title, 
            author, 
            year: year || new Date().getFullYear(),
            genre,
            status: status || 'available',
            className,
            available: parseInt(available) || 1
        });

        console.log('Saving book:', book);
        const savedBook = await book.save();
        
        console.log('Book saved successfully:', savedBook);
        res.status(201).json({
            success: true,
            data: savedBook
        });
        
    } catch (err) {
        console.error('Error saving book:', {
            message: err.message,
            name: err.name,
            code: err.code,
            keyPattern: err.keyPattern,
            keyValue: err.keyValue
        });
        
        res.status(400).json({ 
            success: false,
            message: err.message,
            // Only include stack trace in development
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
});

module.exports = router;
