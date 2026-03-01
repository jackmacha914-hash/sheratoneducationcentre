const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Pick MONGODB_URI first, fallback to MONGO_URI
    let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "❌ MongoDB URI is not defined in environment variables (MONGODB_URI or MONGO_URI)."
      );
    }

    // Remove surrounding quotes and whitespace (handles Render secrets)
    mongoUri = mongoUri.replace(/^["']|["']$/g, '').trim();

    // Debug log: show exactly what's being used
    console.log("Raw Mongo URI:", JSON.stringify(mongoUri));

    // Mask password for logging
    const safeUri = mongoUri.replace(/:\/\/.*:.*@/, "://<username>:<password>@");
    console.log("Using MongoDB URI:", safeUri);

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`🧠 Connected DB name: ${conn.connection.name}`); // Shows the actual DB
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
