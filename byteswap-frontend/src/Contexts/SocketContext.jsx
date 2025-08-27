import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../Services/socket';
import { createUserName } from "../Constants/values.js";

const SocketContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketInstance = socketService.connect();
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            console.log('🟢 SocketProvider: Socket connected');
            setIsConnected(true);

            try {
                const userData = localStorage.getItem('user');

                if (userData) {
                    const user = JSON.parse(userData);

                    const userId = user.id || user._id;
                    if (userId) {
                        let userAnonymousName = user.userAnonymousName;
                        if (!userAnonymousName) {
                            userAnonymousName = createUserName();

                            user.anonymousName = userAnonymousName;
                            localStorage.setItem('user', JSON.stringify(user));
                        }

                        socketInstance.emit('authenticate-user', {
                            userId: userId,
                            userAnonymousName: userAnonymousName
                        });
                    } else {
                        console.error('❌ SocketProvider: No user.id or user._id found in localStorage');
                    }
                } else {
                    console.warn('⚠️ SocketProvider: No user data found in localStorage');
                }
            } catch (error) {
                console.error('❌ SocketProvider: Error parsing user data:', error);
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('🔴 SocketProvider: Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ SocketProvider: Socket connection error:', error);
        });

        return () => {
            console.log('🔌 SocketProvider: Cleaning up socket connection');
            socketService.disconnect();
        };
    }, []);

    const value = {
        socket,
        isConnected,
        joinChat: socketService.joinChat.bind(socketService),
        sendMessage: socketService.sendMessage.bind(socketService),
        onReceiveMessage: socketService.onReceiveMessage.bind(socketService),
        offReceiveMessage: socketService.offReceiveMessage.bind(socketService),
        startTyping: socketService.startTyping.bind(socketService),
        stopTyping: socketService.stopTyping.bind(socketService),
        onUserTyping: socketService.onUserTyping.bind(socketService),
        offUserTyping: socketService.offUserTyping.bind(socketService),
        joinMatching: socketService.joinMatching.bind(socketService),
        leaveMatching: socketService.leaveMatching.bind(socketService),
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
