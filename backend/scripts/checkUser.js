const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Connected to MongoDB...');
        
        // Get the User model
        const User = require('../models/User');
        
        // Find the admin user
        const user = await User.findOne({ email: 'jackmacha@gmail.com' });
        
        if (!user) {
            console.log('User not found');
        } else {
            console.log('User found:', {
                email: user.email,
                role: user.role,
                passwordHash: user.password,
                createdAt: user.createdAt
            });
            
            // Check if we can authenticate
            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare('Kenya254.', user.password);
            console.log('Password match:', isMatch);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
