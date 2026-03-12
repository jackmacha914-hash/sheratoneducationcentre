// createAdmin.js
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("❌ MongoDB URI is not defined in .env");
  process.exit(1);
}

const adminData = {
  name: "Admin User",
  email: "admin@admin.com",
  role: "admin",
  password: "admin123"
};

async function createAdmin() {
  try {

    console.log("🚀 Creating admin...");

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");

    // Delete existing admin
    await User.deleteOne({ email: adminData.email });
    console.log("⚠️ Deleted existing admin if it existed");

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create user
    const adminUser = new User({
      name: adminData.name,
      email: adminData.email,
      role: adminData.role,
      password: hashedPassword
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("Email:", adminData.email);
    console.log("Password:", adminData.password);

    process.exit(0);

  } catch (error) {

    console.error("❌ Error:", error);
    process.exit(1);

  }
}

createAdmin();
