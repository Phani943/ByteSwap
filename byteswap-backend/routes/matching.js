const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/validator');
const { buildSession } = require('../utils/buildSession');

const MATCHING_TIMEOUT_MS = 5 * 60 * 1000;

router.post('/find-matches', auth, async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const logPrefix = `[Matching-API-${requestId}]`;

    const { skillsToTeach = [], skillsToLearn = [] } = req.body;
    const userId = req.user._id;

    if (!skillsToTeach.length && !skillsToLearn.length) {
        return res.status(400).json({ message: 'Provide skills' });
    }

    try {
        await User.findByIdAndUpdate(userId, {
            $set: {
                skillsTeaching: skillsToTeach,
                skillsLearning: skillsToLearn,
                lastMatchingAttempt: new Date()
            }
        });

        const cutoffTime = new Date(Date.now() - MATCHING_TIMEOUT_MS);

        const allUsers = await User.find({
            _id: { $ne: userId },
            $or: [
                { skillsTeaching: { $exists: true, $not: { $size: 0 } } },
                { skillsLearning: { $exists: true, $not: { $size: 0 } } }
            ],
            lastMatchingAttempt: { $gte: cutoffTime }
        });

        console.log(`${logPrefix} 👥 Found ${allUsers.length} active candidates (excluding stale attempts):`,
            allUsers.map(u => ({
                id: u._id.toString(),
                name: u.name,
                skillsTeaching: u.skillsTeaching,
                skillsLearning: u.skillsLearning,
                lastMatchingAttempt: u.lastMatchingAttempt
            }))
        );

        const perfect = [];
        const oneWay = [];

        allUsers.forEach(candidate => {
            const candidateCanTeachUserWants = candidate.skillsTeaching.some(skill =>
                skillsToLearn.includes(skill)
            );

            const candidateWantsToLearnUserTeaches = candidate.skillsLearning.some(skill =>
                skillsToTeach.includes(skill)
            );

            const userCanTeachCandidateWants = skillsToTeach.some(skill =>
                candidate.skillsLearning.includes(skill)
            );

            const userWantsToLearnCandidateTeaches = skillsToLearn.some(skill =>
                candidate.skillsTeaching.includes(skill)
            );

            if ((candidateCanTeachUserWants && userCanTeachCandidateWants) ||
                (candidateWantsToLearnUserTeaches && userWantsToLearnCandidateTeaches)) {
                console.log(`${logPrefix} ✅ PERFECT MATCH with ${candidate.name}`);
                perfect.push(candidate);
            }
            else if (candidateCanTeachUserWants || userCanTeachCandidateWants ||
                candidateWantsToLearnUserTeaches || userWantsToLearnCandidateTeaches) {
                console.log(`${logPrefix} ⚠️ PARTIAL MATCH with ${candidate.name}`);
                oneWay.push(candidate);
            } else {
                console.log(`${logPrefix} ❌ NO MATCH with ${candidate.name}`);
            }
        });

        const wrap = u => {

            const sessionData = buildSession(userId.toString(), u._id.toString());

            return {
                _id: u._id,
                partnerAnonymousName: sessionData.partnerName,
                userAnonymousName: sessionData.userName,
                partnerName: u.name,
                skillsTeaching: u.skillsTeaching,
                skillsLearning: u.skillsLearning,
                sharedSessionId: sessionData.sessionId
            };
        };

        const perfectMatches = perfect.map(wrap);
        const fallbackMatches = oneWay.map(wrap);

        const response = {
            perfectMatches,
            fallbackMatches
        };

        res.json(response);

    } catch (error) {
        console.error(`${logPrefix} 💥 DATABASE ERROR:`, {
            error: error.message,
            stack: error.stack,
            userId: userId.toString()
        });

        res.status(500).json({
            message: 'Error finding matches',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.post('/cleanup-preferences', auth, async (req, res) => {
    const userId = req.user._id;
    const logPrefix = `[Cleanup-${userId.toString().slice(-6)}]`;

    try {
        await User.findByIdAndUpdate(userId, {
            $unset: {
                skillsTeaching: 1,
                skillsLearning: 1,
                lastMatchingAttempt: 1
            }
        });

        console.log(`${logPrefix} ✅ Preferences cleaned successfully`);
        res.json({ message: 'Preferences cleaned up successfully' });

    } catch (error) {
        console.error(`${logPrefix} ❌ Cleanup error:`, error.message);
        res.status(500).json({
            message: 'Error cleaning up preferences',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
