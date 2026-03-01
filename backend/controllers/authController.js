const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
require('dotenv').config();

// User Registration with Validation
exports.registerUser = [
    check("name").notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Invalid email"),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log('Registration request body:', JSON.stringify(req.body, null, 2));
        
        const { name, email, password, role = "student", profile = {} } = req.body;
        
        try {
            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ 
                    success: false,
                    message: "User with this email already exists"
                });
            }

            // Validate class for students
            if (role === 'student' && !req.body.class) {
                return res.status(400).json({ 
                    success: false,
                    message: "Class is required for student registration"
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Prepare user data
            const userData = { 
                name, 
                email, 
                password: hashedPassword, 
                role,
                profile: { ...profile }
            };
            
            // Handle class assignment
            if (req.body.class) {
                const classValue = req.body.class.trim();
                console.log('Processing class:', classValue);
                
               // Validate class format
if (
  !/^(Grade\s\d{1,2}|Form\s[1-4]|Pre-Primary 1 \(PP1\)|Pre-Primary 2 \(PP2\))$/i
    .test(classValue)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid class format. Please use format 'Grade X', 'Form X', 'PP1' or 'PP2'"
  });
}

                
                // Standardize class format (e.g., 'grade 1' -> 'Grade 1')
                const formattedClass = classValue
                    .toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                userData.class = formattedClass;
                userData.classAssigned = formattedClass;
                userData.profile = userData.profile || {};
                userData.profile.class = formattedClass;
                
                console.log('Formatted class:', formattedClass);
            }
            
            console.log('Creating user with data:', JSON.stringify({
                name,
                email,
                role,
                class: userData.class,
                profileClass: userData.profile?.class
            }, null, 2));
            
            // Create and save user
            const newUser = new User(userData);
            await newUser.save();

            // Generate JWT token
            const payload = { 
                id: newUser.id, 
                role: newUser.role,
                class: newUser.class
            };
            
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

            res.status(201).json({ 
                success: true,
                message: "User registered successfully", 
                token, 
                role: newUser.role,
                class: newUser.class
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Server error" });
        }
    }
];

// User Login
exports.loginUser = async (req, res) => {
    console.log('=== Login Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ 
            success: false,
            msg: 'Please provide both email and password' 
        });
    }
    
    console.log('Login attempt for email:', email);
    
    try {
        // Case insensitive email search
        const user = await User.findOne({ 
            email: { $regex: new RegExp('^' + email + '$', 'i') } 
        });
        
        if (!user) {
            console.log('❌ User not found with email:', email);
            return res.status(401).json({ 
                success: false,
                msg: 'Invalid email or password' 
            });
        }
        console.log('User found:', { id: user.id, role: user.role });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password does not match');
            return res.status(401).json({ msg: "Invalid email or password" });
        }
        console.log('Password matches');
        console.log('User role:', user.role);

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set');
            return res.status(500).json({ msg: "JWT Secret is missing" });
        }
        console.log('JWT_SECRET is set');

        // Create token payload
        const payload = { 
            id: user._id,  // Changed from user.id to user._id for MongoDB
            role: user.role 
        };
        console.log('Token payload:', payload);

        // Generate token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log('JWT Token generated');

        // Prepare user data (exclude sensitive info)
        const userData = {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name || ''
        };

        // Send response
        res.json({ 
            success: true,
            msg: "Login successful", 
            token, 
            role: user.role,
            user: userData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
