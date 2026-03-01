// createAdmin.js
require('dotenv').config(); // Load .env variables

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // make sure this path is correct

// Check if env is loaded
console.log("Mongo URI:", process.env.MONGODB_URI);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("❌ MongoDB URI is not defined in .env");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// Admin credentials
const adminData = {
  name: "Admin User",
  email: "admin@admin.com",
  role: "admin",
  password: "admin123" // plaintext; will be hashed
};

// Hash password and create admin
async function createAdmin() {
  try {
    // Delete existing admin if any
    await User.deleteOne({ email: adminData.email });
    console.log("⚠️ Deleted any existing admin user");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create new admin
    const adminUser = new User({
      ...adminData,
      password: hashedPassword
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}
