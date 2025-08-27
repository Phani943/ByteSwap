import { io } from 'socket.io-client';
import { API_BASE_URL } from '../Constants/values.js';

class SocketService {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.isConnected = false;
    }

    connect() {
        console.log('🔌 SocketService: Creating new socket connection to:', API_BASE_URL);
        this.socket = io(API_BASE_URL, {
            forceNew: true,
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
        });
        this.setupEventListeners();
        return this.socket;
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('🟢 SocketService: Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;

            const raw = localStorage.getItem('user');
            if (raw) {
                try {
                    const user = JSON.parse(raw);
                    const userId = user.id || user._id;
                    if (userId) {
                        this.socket.emit('authenticate-user', { userId, userAnonymousName: user.name || 'Anonymous' });
                        console.log('🔐 SocketService: Emitted authenticate-user', userId);
                    }
                } catch (e) {
                    console.error('❌ Error parsing user data during connect:', e);
                }
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔴 SocketService: Disconnected, reason:', reason);
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ SocketService: Connection error:', error);
            this.reconnectAttempts++;
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
            this.isConnected = true;
        });
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 SocketService: Disconnecting');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    joinChat(sessionId) {
        this.socket?.emit('join-session-room', { sessionId });
    }

    sendMessage(sessionId, message, senderName) {
        this.socket?.emit('send-message', {
            sessionId,
            message,
            senderName,
            timestamp: new Date().toISOString()
        });
    }

    onReceiveMessage(callback) {
        this.socket?.on('receive-message', callback);
    }

    offReceiveMessage() {
        this.socket?.off('receive-message');
    }

    startTyping(sessionId) {
        this.socket?.emit('typing-start', { sessionId });
    }

    stopTyping(sessionId) {
        this.socket?.emit('typing-stop', { sessionId });
    }

    onUserTyping(callback) {
        this.socket?.on('user-typing', callback);
    }

    offUserTyping() {
        this.socket?.off('user-typing');
    }

    joinMatching(userData) {
        this.socket?.emit('join-matching', userData);
    }

    leaveMatching() {
        this.socket?.emit('leave-matching');
    }
}

export default new SocketService();
