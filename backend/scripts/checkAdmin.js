const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function checkAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Connected to MongoDB...');
        
        // Check if admin exists
        const adminEmail = 'jackmacha@gmail.com';
        const admin = await User.findOne({ email: adminEmail });
        
        if (!admin) {
            console.log('Admin user not found. Creating one...');
            
            // Create admin user
            const hashedPassword = await bcrypt.hash('Kenya254.', 10);
            
            const newAdmin = new User({
                name: 'Admin User',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                profile: {
                    fullName: 'System Administrator'
                }
            });
            
            await newAdmin.save();
            console.log('Admin user created successfully!');
            console.log('Email:', adminEmail);
            console.log('Password: Kenya254.');
        } else {
            console.log('Admin user exists:');
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
            
            // Reset password if needed
            if (process.argv.includes('--reset-password')) {
                const newPassword = 'Kenya254.'; // Confirmed working password
                admin.password = await bcrypt.hash(newPassword, 10);
                await admin.save();
                console.log('\nAdmin password has been reset to:', newPassword);
                console.log('Please use this exact password (case sensitive):', newPassword);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmin();
