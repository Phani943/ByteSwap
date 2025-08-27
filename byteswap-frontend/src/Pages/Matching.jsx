import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiClock,
    FiRefreshCw,
    FiHome,
    FiCheck,
    FiX,
    FiUsers,
    FiTarget,
    FiSend,
    FiLoader
} from 'react-icons/fi';
import { ROUTES, MATCHING_TIMEOUT } from '../Constants/values';
import { findMatches, cleanupMatchingPreferences } from '../Services/api';
import { useSocket } from '../Contexts/SocketContext';

const POLL_INTERVAL = 4000;

function Timer({ onTimeout }) {
    const [timeLeft, setTimeLeft] = useState(MATCHING_TIMEOUT);
    const onTimeoutRef = useRef(onTimeout);

    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimeout(() => onTimeoutRef.current(), 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <FiClock className="text-blue-600" />
                <span className="text-gray-700">Time remaining:</span>
                <span className="font-bold text-blue-600 font-mono">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
            </div>
        </div>
    );
}

const getUserId = () => {
    try {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            return parsed._id || parsed.id || 'unknown';
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
    }
    return 'unknown';
};

function Matching() {
    const { socket } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();

    const userIdRef = useRef(getUserId());
    const userId = userIdRef.current;

    const skillsFromLocation = location.state || {};
    const skillsToTeach = skillsFromLocation.skillsToTeach || [];
    const skillsToLearn = skillsFromLocation.skillsToLearn || [];

    const [status, setStatus] = useState('searching');
    const [matches, setMatches] = useState([]);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [incomingRequest, setIncomingRequest] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const intervalRef = useRef(null);

    useEffect(() => {
        if (!skillsToTeach.length && !skillsToLearn.length) {
            navigate(ROUTES.DASHBOARD);
        }
    }, [skillsToTeach.length, skillsToLearn.length, navigate]);

const handleTimeout = useRef(async () => {
        try {
            await cleanupMatchingPreferences();
            console.log(`[Matching -> ${userId}] 🧹 Preferences cleaned up on timeout`);
        } catch (error) {
            console.error(`[Matching -> ${userId}] ❌ Cleanup error on timeout:`, error);
        }

        setStatus('timeout');
    });

    useEffect(() => {
        if (status !== 'searching') return;

        const poll = async () => {
            try {
                const { data } = await findMatches({ skillsToTeach, skillsToLearn });
                const allMatches = [...(data?.perfectMatches || []), ...(data?.fallbackMatches || [])];
                setMatches(allMatches);
            } catch (error) {
                console.error(`[Matching -> ${userId}] ❌ Polling error:`, error);
            }
        };

        poll().catch(error => {
            console.error(`[Matching -> ${userId}] <UNK> Polling error:`, error);
        });
        intervalRef.current = setInterval(poll, POLL_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [status]);

    useEffect(() => {
        return () => {
            if (status === 'searching') {
                console.log(`[Matching -> ${userId}] Component unmounting - cleaning up`);
                cleanupMatchingPreferences().catch(error => {
                    console.error(`[Matching -> ${userId}] ❌ Cleanup error on unmount:`, error);
                });
            }
        };
    }, [status, userId]);

    useEffect(() => {
        if (!socket) return;

        if (userId && userId !== 'unknown') {
            const tempName = `user_${userId.slice(-4)}`;
            socket.emit('authenticate-user', {
                userId,
                userAnonymousName: tempName
            });
            setIsAuthenticated(true);
        }

        const onPartnerRequest = (data) => {
            if (status !== 'searching') return;
            console.log(`[Matching -> ${userId}] 📨 PARTNER REQUEST:`, data);
            setIncomingRequest(data);
        };

        const onRequestAccepted = (data) => {
            console.log(`[Matching -> ${userId}] ✅ REQUEST ACCEPTED:`, data);

            const sessionData = {
                myAnonymousName: data.requesterAnonymousName,
                partnerName: data.accepterAnonymousName
            };

            localStorage.setItem(`session_${data.sessionId}`, JSON.stringify(sessionData));
            navigate(`/chat/${data.sessionId}`);
        };

        const onRequestRejected = () => {
            console.log(`[Matching -> ${userId}] ❌ REQUEST REJECTED`);
            setPendingRequest(null);
            alert('Partner declined. Keep searching!');
        };

        const onUserBusy = () => {
            console.log(`[Matching -> ${userId}] ⚠️ USER BUSY`);
            setPendingRequest(null);
            alert('User is currently busy. Try selecting another partner.');
        };

        const onPartnerNotAvailable = () => {
            console.log(`[Matching -> ${userId}] ❌ PARTNER NOT AVAILABLE`);
            setPendingRequest(null);
            alert('Partner is no longer available. Keep searching!');
        };

        const onAuthRequired = () => {
            console.log(`[Matching -> ${userId}] ❌ Authentication required`);
            alert('Connection error. Please refresh and try again.');
            navigate(ROUTES.DASHBOARD);
        };

        const onRequestSent = (data) => {
            console.log(`[Matching -> ${userId}] 📤 REQUEST SENT confirmation:`, data);
        };

        socket.on('partner-request', onPartnerRequest);
        socket.on('request-accepted', onRequestAccepted);
        socket.on('request-rejected', onRequestRejected);
        socket.on('user-busy', onUserBusy);
        socket.on('partner-not-available', onPartnerNotAvailable);
        socket.on('authentication-required', onAuthRequired);
        socket.on('request-sent', onRequestSent);

        return () => {
            socket.off('partner-request', onPartnerRequest);
            socket.off('request-accepted', onRequestAccepted);
            socket.off('request-rejected', onRequestRejected);
            socket.off('user-busy', onUserBusy);
            socket.off('partner-not-available', onPartnerNotAvailable);
            socket.off('authentication-required', onAuthRequired);
            socket.off('request-sent', onRequestSent);
        };
    }, [socket, userId, status, navigate]);

    const selectPartner = (match) => {
        if (status !== 'searching') return;
        console.log(`[Matching -> ${userId}] 🎯 SELECT PARTNER CLICKED:`, match.partnerAnonymousName);

        if (!socket || !socket.connected) {
            console.warn(`[Matching -> ${userId}] ⚠️ Socket not connected`);
            alert('Connection lost. Please refresh and try again.');
            return;
        }

        if (!isAuthenticated) {
            console.warn(`[Matching -> ${userId}] ⚠️ Socket not authenticated`);
            alert('Authentication in progress. Please wait a moment and try again.');
            return;
        }

        if (pendingRequest) {
            console.warn(`[Matching -> ${userId}] ⚠️ Cannot select - pending request exists`);
            return;
        }

        setPendingRequest(match);

        const requestData = {
            partnerId: match._id,
            sessionId: match.sharedSessionId,
            requesterAnonymousName: match.userAnonymousName,
            partnerAnonymousName: match.partnerAnonymousName
        };

        console.log(`[Matching -> ${userId}] 📤 EMITTING select-partner:`, requestData);
        socket.emit('select-partner', requestData);

        setTimeout(async () => {
            if (pendingRequest && pendingRequest._id === match._id) {
                console.log(`[Matching -> ${userId}] ⏰ REQUEST TIMEOUT - Cleaning up`);
                setPendingRequest(null);

                try {
                    await cleanupMatchingPreferences();
                    console.log(`[Matching -> ${userId}] 🧹 Preferences cleaned up on request timeout`);
                } catch (error) {
                    console.error(`[Matching -> ${userId}] ❌ Cleanup error on request timeout:`, error);
                }

                alert('Request timed out. Partner may be busy.');
            }
        }, 30000);
    };

    const acceptRequest = () => {
        console.log(`[Matching -> ${userId}] ✅ ACCEPT CLICKED`);

        if (!socket || !socket.connected || !incomingRequest) {
            console.error(`[Matching -> ${userId}] ❌ Cannot accept - missing requirements`);
            return;
        }

        const acceptData = {
            requesterId: incomingRequest.requesterId,
            sessionId: incomingRequest.sessionId,
            accepterAnonymousName: incomingRequest.partnerAnonymousName,
            partnerAnonymousName: incomingRequest.requesterAnonymousName
        };

        socket.emit('accept-partner-request', acceptData);

        const sessionData = {
            myAnonymousName: incomingRequest.partnerAnonymousName,
            partnerName: incomingRequest.requesterAnonymousName
        };

        localStorage.setItem(`session_${incomingRequest.sessionId}`, JSON.stringify(sessionData));

        console.log(`[Matching -> ${userId}] 🚀 Navigating to: /chat/${incomingRequest.sessionId}`);
        navigate(`/chat/${incomingRequest.sessionId}`);
    };

    const rejectRequest = () => {
        console.log(`[Matching -> ${userId}] ❌ REJECT CLICKED`);
        if (!socket || !incomingRequest) return;

        socket.emit('reject-partner-request', {
            requesterId: incomingRequest.requesterId
        });
        setIncomingRequest(null);
    };

    const retry = () => {
        console.log(`[Matching -> ${userId}] 🔄 RETRY`);
        setStatus('searching');
        setMatches([]);
        setPendingRequest(null);
        setIncomingRequest(null);
    };

    const cancel = async () => {
        console.log(`[Matching -> ${userId}] ❌ CANCEL - Cleaning up preferences`);

        try {
            await cleanupMatchingPreferences();
            console.log(`[Matching -> ${userId}] 🧹 Preferences cleaned up on cancel`);
        } catch (error) {
            console.error(`[Matching -> ${userId}] ❌ Cleanup error on cancel:`, error);
        }

        navigate(ROUTES.DASHBOARD);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
            <div className="max-w-lg w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">

                {incomingRequest && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiUsers className="text-white text-2xl" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Request!</h3>
                                <p className="text-gray-600">
                                    <span className="font-semibold text-blue-600">
                                        {incomingRequest.requesterAnonymousName}
                                    </span> wants to start a learning session with you!
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={acceptRequest}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg"
                                >
                                    <FiCheck className="text-lg" />
                                    <span>Accept</span>
                                </button>
                                <button
                                    onClick={rejectRequest}
                                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg"
                                >
                                    <FiX className="text-lg" />
                                    <span>Decline</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'searching' && (
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiSearch className="text-white text-2xl" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Finding Your Learning Partner
                            </h2>
                            <p className="text-gray-600">We're matching you with someone perfect for skill exchange</p>
                            {!isAuthenticated && (
                                <p className="text-sm text-amber-600 mt-2">Connecting...</p>
                            )}
                        </div>

                        <Timer onTimeout={handleTimeout.current} />

                        <div className="flex items-center justify-center mb-8">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500/20 border-r-purple-500 rounded-full animate-spin animate-reverse" style={{animationDuration: '1.5s'}}></div>
                            </div>
                        </div>

                        {matches.length > 0 && (
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center space-x-2 text-green-700 bg-green-50 rounded-lg p-3">
                                    <FiTarget className="text-xl" />
                                    <span className="font-semibold">Perfect Matches Found!</span>
                                </div>

                                {matches.map(match => (
                                    <div key={match._id} className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 shadow-sm hover:shadow-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-8 h-8 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">
                                                            {match.partnerAnonymousName[0]?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-green-800 text-lg">
                                                        {match.partnerAnonymousName}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <FiTarget className="text-green-600" />
                                                    <span className="text-green-600 font-medium">Perfect Match</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => selectPartner(match)}
                                            disabled={!!pendingRequest || !isAuthenticated}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center space-x-2"
                                        >
                                            {pendingRequest && pendingRequest._id === match._id ? (
                                                <>
                                                    <FiLoader className="animate-spin text-xl" />
                                                    <span>Sending Request...</span>
                                                </>
                                            ) : !isAuthenticated ? (
                                                <>
                                                    <FiLoader className="animate-spin text-xl" />
                                                    <span>Connecting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiSend className="text-xl" />
                                                    <span>Connect Now!</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={cancel}
                            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                        >
                            <FiX className="text-lg" />
                            <span>Cancel Search</span>
                        </button>
                    </div>
                )}

                {status === 'timeout' && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiClock className="text-white text-2xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Timeout</h2>
                        <p className="text-gray-600 mb-8">
                            We couldn't find a match this time, but don't worry! Try again or check back later when more learners are online.
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={retry}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                            >
                                <FiRefreshCw className="text-xl" />
                                <span>Search Again</span>
                            </button>
                            <button
                                onClick={cancel}
                                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                            >
                                <FiHome className="text-lg" />
                                <span>Back to Dashboard</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Matching;