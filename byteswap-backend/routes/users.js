const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/validator');

router.put('/profile', auth, async (req, res) => {
    try {
        const {skillsTeaching, skillsLearning} = req.body;

        if (!req.user) {
            console.log('❌ Authentication failed - no user attached');
            return res.status(401).json({message: 'User not authenticated'});
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            console.log('❌ User not found in database:', req.user._id);
            return res.status(404).json({message: 'User not found'});
        }

        console.log('📝 Current user skills before update:', {
            teaching: user.skillsTeaching,
            learning: user.skillsLearning
        });

        if (skillsTeaching !== undefined) user.skillsTeaching = skillsTeaching;
        if (skillsLearning !== undefined) user.skillsLearning = skillsLearning;

        console.log('💾 Attempting to save user...');
        await user.save();
        console.log('✅ User saved successfully to MongoDB');

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                skillsTeaching: user.skillsTeaching,
                skillsLearning: user.skillsLearning
            }
        });

    } catch (error) {
        console.error('💥 DETAILED ERROR:', error);
        console.error('💥 ERROR NAME:', error.name);
        res.status(500).json({
            message: 'Error updating profile',
            error: error.message
        });
    }
});

router.put('/clear-matching-skills', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        console.log(`🧹 Clearing matching skills for user ${userId}`);

        await User.findByIdAndUpdate(userId, {
            $set: {
                skillsTeaching: [],
                skillsLearning: [],
                lastMatchingAttempt: null
            }
        });

        console.log(`✅ Successfully cleared matching skills for user ${userId}`);

        res.json({
            success: true,
            message: 'Matching skills cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing matching skills:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear matching skills'
        });
    }
});

router.put('/change-password', auth, async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({message: 'Both current and new password are required'});
        }

        if (newPassword.length < 6) {
            return res.status(400).json({message: 'New password must be at least 6 characters'});
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({message: 'Current password is incorrect'});
        }

        user.password = newPassword;
        await user.save();

        res.json({message: 'Password updated successfully'});
    } catch (err) {
        console.error('Change-password error:', err);
        res.status(500).json({message: 'Server error changing password'});
    }
});

router.post('/delete-account', auth, async (req, res) => {
    try {
        const {currentPassword} = req.body;
        if (!currentPassword) {
            return res.status(400).json({message: 'Current password is required'});
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({message: 'Current password is incorrect'});
        }

        await user.deleteOne();
        res.json({message: 'Account deleted successfully'});
    } catch (err) {
        console.error('Delete-account error:', err);
        res.status(500).json({message: 'Server error deleting account'});
    }
});

module.exports = router;
