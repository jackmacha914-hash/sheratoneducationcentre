const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkHash() {
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

        console.log('Current hash in DB:', user.password);
        
        // Generate a new hash with the known password
        const newHash = await bcrypt.hash('Kenya254.', 10);
        console.log('New hash for "Kenya254.":', newHash);
        
        // Compare the hashes
        const isSame = await bcrypt.compare('Kenya254.', user.password);
        console.log('Password matches current hash:', isSame);
        
        // If not matching, update the hash
        if (!isSame) {
            console.log('Updating hash in database...');
            user.password = newHash;
            await user.save();
            console.log('Hash updated successfully!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkHash();
