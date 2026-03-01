const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/config/default.json' });

async function checkFees() {
  try {
    // Connect to MongoDB using the same config as the app
    const config = require('./backend/config/default.json');
    await mongoose.connect(process.env.MONGO_URI || config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if Fee model exists
    const Fee = mongoose.model('Fee');
    
    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections({ name: 'fees' }).toArray();
    if (collections.length === 0) {
      console.log('Error: "fees" collection does not exist in the database');
      return;
    }
    
    console.log('Fee collection exists. Checking for documents...');
    
    // Count documents in fees collection
    const count = await Fee.countDocuments();
    console.log(`Found ${count} fee records in the database`);
    
    // Show a sample if documents exist
    if (count > 0) {
      const sample = await Fee.findOne().populate('student', 'name email').lean();
      console.log('Sample fee record:', JSON.stringify(sample, null, 2));
    }
    
  } catch (error) {
    console.error('Error checking fees:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkFees();
