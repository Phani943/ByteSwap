const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    skillsTeaching: [{
        type: String,
        trim: true
    }],
    skillsLearning: [{
        type: String,
        trim: true
    }],
    lastMatchingAttempt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

userSchema.statics.findMatches = function(userId, skillsToTeach = [], skillsToLearn = []) {
    const conditions = {
        _id: { $ne: userId },
        isActive: true
    };

    const orConditions = [];

    if (skillsToLearn.length > 0 && skillsToTeach.length > 0) {
        orConditions.push({
            $and: [
                { skillsTeaching: { $in: skillsToLearn } },
                { skillsLearning: { $in: skillsToTeach } }
            ]
        });
    }

    if (skillsToTeach.length > 0) {
        orConditions.push({
            skillsLearning: { $in: skillsToTeach }
        });
    }

    if (skillsToLearn.length > 0) {
        orConditions.push({
            skillsTeaching: { $in: skillsToLearn }
        });
    }

    if (orConditions.length === 0) {
        return this.find({ _id: null });
    }

    conditions.$or = orConditions;

    return this.find(conditions).select('-password');
};

module.exports = mongoose.model('User', userSchema);
