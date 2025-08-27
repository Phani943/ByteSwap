const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

router.post('/register', async (req, res) => {
    try {
        const {name, email, password, confirmPassword} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Please provide name, email, and password'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        const existingUser = await User.findOne({email: email.toLowerCase()});
        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        await user.save();

        const token = generateToken(user._id);

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            skillsTeaching: user.skillsTeaching,
            skillsLearning: user.skillsLearning,
        };

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userData
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Server error during registration'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({email: email.toLowerCase().trim()}).select('+password');
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            skillsTeaching: user.skillsTeaching,
            skillsLearning: user.skillsLearning,
        };

        res.json({
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Server error during login'
        });
    }
});

router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({message: 'No token provided'});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({message: 'Invalid token'});
        }

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            skillsTeaching: user.skillsTeaching,
            skillsLearning: user.skillsLearning,
        };

        res.status(200).json({user: userData});

    } catch (error) {
        res.status(401).json({message: 'Invalid token'});
    }
});

module.exports = router;
