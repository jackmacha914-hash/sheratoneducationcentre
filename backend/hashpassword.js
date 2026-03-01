// hashPassword.js
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  console.log('Hashed password:', hashed);
}

hashPassword('admin123'); // <-- This is the password you want
