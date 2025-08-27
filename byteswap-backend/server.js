require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {createServer} = require('http');
const {Server} = require('socket.io');

const User = require('./models/User');

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

app.use(cors({origin: allowedOrigins, credentials: true}));
app.use(express.json());

app.get('/', (_req, res) =>
    res.json({message: 'ByteSwap API is running!', version: '1.0.0', timestamp: new Date().toISOString()})
);

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB error:', err);
        process.exit(1);
    });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matching', require('./routes/matching'));

const io = new Server(httpServer, {
    cors: {origin: allowedOrigins, methods: ['GET', 'POST']},
});

const activeSessionRooms = new Map();
const userSockets = new Map();
const userActiveSession = new Map();

setInterval(() => {
    const staleSessions = [];

    for (const [userId, sessionId] of userActiveSession.entries()) {
        if (!userSockets.has(userId)) {
            staleSessions.push(userId);
        }
    }

    staleSessions.forEach(userId => {
        console.log(`🧹 Cleaning up stale session for disconnected user: ${userId}`);
        userActiveSession.delete(userId);
    });

    if (staleSessions.length > 0) {
        console.log(`📊 Cleaned ${staleSessions.length} stale sessions. Active sessions: ${userActiveSession.size}`);
    }
}, 60000);

io.on('connection', socket => {
    console.log('👤  Socket connected', socket.id);

    socket.on('authenticate-user', ({userId, userAnonymousName}) => {
        if (!userId || userId === 'undefined') {
            console.warn(`⚠️ Invalid userId received: ${userId}`);
            return;
        }

        console.log(`🔐 Authenticating user: ${userId} as ${userAnonymousName}`);

        if (userActiveSession.has(userId)) {
            console.log(`🧹 Clearing stale session for user ${userId}: ${userActiveSession.get(userId)}`);
            userActiveSession.delete(userId);
        }

        socket.userId = userId;
        socket.data.userId = userId;
        socket.data.anon = userAnonymousName;
        userSockets.set(userId, socket.id);

        console.log(`✅ User ${userId} authenticated and mapped to socket ${socket.id}`);
        console.log(`📊 Current active sessions: ${userActiveSession.size}`);
    });

    socket.on('select-partner', async data => {
        if (!socket.userId) {
            console.log(`❌ Unauthenticated socket trying to select partner`);
            socket.emit('authentication-required');
            return;
        }

        const {partnerId, sessionId, requesterAnonymousName, partnerAnonymousName} = data;

        console.log(`📤 select-partner received:`, {
            from: socket.userId,
            to: partnerId,
            sessionId,
            requesterAnonymousName,
            partnerAnonymousName
        });

        const requesterSession = userActiveSession.get(socket.userId);
        const partnerSession = userActiveSession.get(partnerId);

        console.log(`🔍 Session check:`, {
            requesterBusy: !!requesterSession,
            partnerBusy: !!partnerSession,
            requesterSessionId: requesterSession,
            partnerSessionId: partnerSession,
            totalActiveSessions: userActiveSession.size
        });

        if (requesterSession || partnerSession) {
            console.log(`⚠️ User busy - requester: ${requesterSession}, partner: ${partnerSession}`);
            socket.emit('user-busy');
            return;
        }

        const partnerSocketId = userSockets.get(partnerId);
        console.log(`🔍 Looking for partner ${partnerId}, found socket: ${partnerSocketId}`);

        if (partnerSocketId) {
            userActiveSession.set(socket.userId, sessionId);
            userActiveSession.set(partnerId, sessionId);

            console.log(`🔒 Locked users in session ${sessionId}:`, {
                requester: socket.userId,
                partner: partnerId,
                totalActiveSessions: userActiveSession.size
            });

            io.to(partnerSocketId).emit('partner-request', {
                requesterId: socket.userId,
                requesterAnonymousName,
                partnerAnonymousName,
                sessionId,
            });

            socket.emit('request-sent', {
                partnerId,
                partnerAnonymousName
            });
        } else {
            console.log(`❌ Partner ${partnerId} not found or not connected`);

            try {
                await User.findByIdAndUpdate(socket.userId, {
                    $unset: {skillsTeaching: 1, skillsLearning: 1, lastMatchingAttempt: 1}
                });
                console.log(`🧹 Cleaned up preferences for user ${socket.userId} - partner not available`);
            } catch (error) {
                console.error(`❌ Error cleaning up preferences when partner not available:`, error);
            }

            socket.emit('partner-not-available');
        }
    });

    socket.on('accept-partner-request', data => {
        const {requesterId, sessionId, accepterAnonymousName, partnerAnonymousName} = data;
        const requesterSocketId = userSockets.get(requesterId);

        console.log(`✅ accept-partner-request:`, {
            from: socket.userId,
            to: requesterId,
            sessionId,
            requesterSocket: requesterSocketId
        });

        if (!requesterSocketId) {
            console.log(`❌ Requester ${requesterId} socket not found`);
            return;
        }

        io.to(requesterSocketId).emit('request-accepted', {
            sessionId,
            requesterAnonymousName: partnerAnonymousName,
            accepterAnonymousName,
        });
    });

    socket.on('reject-partner-request', async ({requesterId}) => {
        const requesterSocketId = userSockets.get(requesterId);
        console.log(`❌ reject-partner-request from ${socket.userId} to ${requesterId}`);

        if (requesterSocketId) {
            io.to(requesterSocketId).emit('request-rejected');
        }

        try {
            await Promise.all([
                User.findByIdAndUpdate(requesterId, {
                    $unset: {skillsTeaching: 1, skillsLearning: 1, lastMatchingAttempt: 1}
                }),
                User.findByIdAndUpdate(socket.userId, {
                    $unset: {skillsTeaching: 1, skillsLearning: 1, lastMatchingAttempt: 1}
                })
            ]);
            console.log(`🧹 Cleaned up preferences for both users after rejection`);
        } catch (error) {
            console.error(`❌ Error cleaning up preferences after rejection:`, error);
        }

        userActiveSession.delete(requesterId);
        userActiveSession.delete(socket.userId);
    });

    socket.on('join-session-room', ({sessionId, userAnonymousName}) => {
        const room = activeSessionRooms.get(sessionId);

        console.log(`🚪 join-session-room: ${userAnonymousName} joining ${sessionId}`);

        if (room && room.started && room.users.length === 0) {
            console.log(`⚠️ Stale session detected for ${sessionId}, notifying user`);
            socket.emit('session-closed');
            return;
        }

        if (room && room.users.length === 1 && room.refreshTerminated) {
            console.log(`⚠️ Session ${sessionId} was terminated by refresh, redirecting user`);
            socket.emit('session-terminated', {
                sessionId,
                reason: 'disconnect',
                terminatedBy: room.refreshTerminatedBy || 'Partner'
            });
            return;
        }

        socket.join(sessionId);

        const sessionRoom = room || {users: [], started: false, startTime: null};
        if (!sessionRoom.users.some(u => u.socketId === socket.id)) {
            sessionRoom.users.push({socketId: socket.id, userId: socket.userId, anonymousName: userAnonymousName});
        }
        activeSessionRooms.set(sessionId, sessionRoom);

        console.log(`👥 Session ${sessionId} now has ${sessionRoom.users.length} users`);

        io.to(sessionId).emit('user-joined-session', {
            allUsers: sessionRoom.users.map(u => u.anonymousName)
        });
    });

    socket.on('start-session', async ({sessionId}) => {
        const room = activeSessionRooms.get(sessionId);
        if (!room || room.started) return;

        console.log(`🚀 Starting session ${sessionId}`);

        room.started = true;
        room.startTime = Date.now();

        await Promise.all(room.users.map(u =>
            User.updateOne({_id: u.userId}, {$set: {skillsTeaching: [], skillsLearning: []}})));

        io.to(sessionId).emit('session-started', {
            sessionId,
            startTime: room.startTime,
            startedBy: socket.data.anon,
        });
    });

    socket.on('send-message', ({sessionId, message, senderName, timestamp}) => {
        io.to(sessionId).emit('receive-message', {
            sessionId,
            message,
            senderName,
            timestamp,
            messageId: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        });
    });

    socket.on('typing-start', ({sessionId, senderName}) =>
        socket.to(sessionId).emit('user-typing', {typing: true, senderName}));
    socket.on('typing-stop', ({sessionId, senderName}) =>
        socket.to(sessionId).emit('user-typing', {typing: false, senderName}));

    socket.on('terminate-session', ({sessionId, reason, terminatedBy}) => {
        const room = activeSessionRooms.get(sessionId);
        if (!room) return;

        console.log(`🔚 Session ${sessionId} terminated by ${terminatedBy}, reason: ${reason}`);

        io.to(sessionId).emit('session-terminated', {
            sessionId,
            reason: reason || 'manual',
            terminatedBy: terminatedBy || 'unknown',
        });
        clearActive(room);
        activeSessionRooms.delete(sessionId);
    });

    socket.on('disconnect', async () => {
        console.log(`👤 Socket disconnected: ${socket.id} (User: ${socket.userId})`);

        if (socket.userId) {
            const activeSessionId = userActiveSession.get(socket.userId);
            if (activeSessionId) {
                console.log(`🧹 Removing user ${socket.userId} from active session ${activeSessionId}`);
                userActiveSession.delete(socket.userId);
            }

            try {
                const user = await User.findById(socket.userId);
                if (user && (user.skillsTeaching?.length > 0 || user.skillsLearning?.length > 0)) {
                    await User.findByIdAndUpdate(socket.userId, {
                        $unset: {skillsTeaching: 1, skillsLearning: 1, lastMatchingAttempt: 1}
                    });
                    console.log(`🧹 Cleaned up matching preferences for disconnected user ${socket.userId}`);
                }
            } catch (error) {
                console.error(`❌ Error cleaning up preferences for disconnected user:`, error);
            }

            userSockets.delete(socket.userId);
        }

        activeSessionRooms.forEach((room, sessionId) => {
            const userIndex = room.users.findIndex(u => u.socketId === socket.id);
            if (userIndex === -1) return;

            const [leftUser] = room.users.splice(userIndex, 1);
            console.log(`👋 User ${leftUser.anonymousName} left session ${sessionId}`);

            if (room.started && room.users.length >= 1) {
                room.refreshTerminated = true;
                room.refreshTerminatedBy = leftUser.anonymousName;

                io.to(sessionId).emit('session-terminated', {
                    sessionId,
                    reason: 'disconnect',
                    terminatedBy: leftUser.anonymousName,
                });

                setTimeout(() => {
                    clearActive(room);
                    activeSessionRooms.delete(sessionId);
                }, 1000);
            } else if (room.users.length === 0) {
                clearActive(room);
                activeSessionRooms.delete(sessionId);
            } else {
                io.to(sessionId).emit('user-left-session', {
                    userAnonymousName: leftUser.anonymousName,
                    allUsers: room.users.map(u => u.anonymousName),
                });
            }
        });
    });

    function clearActive(room) {
        if (room && room.users) {
            room.users.forEach(u => {
                if (u.userId) {
                    userActiveSession.delete(u.userId);
                }
            });
        }
    }
});

app.use((err, _req, res, _next) => {
    console.error('💥  Error:', err.stack);
    res.status(500).json({message: 'Internal server error'});
});
app.use((_req, res) => res.status(404).json({message: 'API route not found'}));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀  API + Socket.IO listening on ${PORT}`);
    console.log(`🌍  Allowed origins: ${allowedOrigins.join(', ')}`);
});

process.on('SIGTERM', () => {
    console.log('👋  SIGTERM received, shutting down');
    httpServer.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});
