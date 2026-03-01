const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const User = require('../models/User');
        const user = await User.findOne({ email: 'jackmacha@gmail.com' });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User found:', {
            email: user.email,
            passwordHash: user.password
        });

        // Test password match
        const testPasswords = [
            'Kenya254.',
            'Kenya254',
            'kenya254.',
            'kenya254',
            'admin123',
            'password',
            'admin',
            'Admin123',
            'Admin123!',
            'admin@123'
        ];

        for (const pwd of testPasswords) {
            const isMatch = await bcrypt.compare(pwd, user.password);
            console.log(`Password "${pwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPassword();
