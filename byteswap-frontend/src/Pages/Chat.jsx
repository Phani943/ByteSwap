import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {FiAlertCircle, FiClock, FiCopy, FiPhoneOff, FiSend, FiUsers, FiWifi, FiWifiOff, FiX} from 'react-icons/fi';
import {ROUTES, SESSION_DURATION} from '../Constants/values';
import {useSocket} from '../Contexts/SocketContext';

const MAX_DURATION = SESSION_DURATION * 60;
const MAX_TEXTAREA_H = 112;

function Chat() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();

    const [session, setSession] = useState(null);
    const [status, setStatus] = useState('waiting');
    const [timeLeft, setTime] = useState(MAX_DURATION);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [typing, setTyping] = useState(false);
    const [, setPeers] = useState([]);
    const [terminated, setTerm] = useState(null);
    const [banner, setBanner] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(null);
    const [connected, setConnected] = useState(false);
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const endRef = useRef(null);
    const textRef = useRef(null);
    const typingRef = useRef(null);
    const timerRef = useRef(null);

    const scroll = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });
    const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const timeClr = s => s > 300 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
        : s > 60 ? 'text-amber-600 bg-amber-50 border-amber-200'
            : 'text-red-600 bg-red-50 border-red-200';
    const grow = el => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_H) + 'px';
        el.style.overflow = el.scrollHeight > MAX_TEXTAREA_H ? 'auto' : 'hidden';
    };
    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFeedback('Copied!');
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch (err) {
            setCopyFeedback('Failed to copy');
            console.log(err);
            setTimeout(() => setCopyFeedback(null), 2000);
        }
    };

    useEffect(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        setBanner(nav?.type === 'reload');

        const raw = localStorage.getItem(`session_${sessionId}`);
        if (!raw) {
            navigate(ROUTES.DASHBOARD);
            return;
        }
        const sess = JSON.parse(raw);
        setSession(sess);

        if (socket && isConnected) {
            socket.emit('join-session-room', { sessionId, userAnonymousName: sess.myAnonymousName });
            setTimeout(() => socket.emit('start-session', { sessionId }), 400);
        }
    }, [sessionId, socket, isConnected, navigate]);

    useEffect(() => {
        const disableBackButton = () => {
            window.history.pushState(null, '', window.location.href);

            const onPopState = () => {
                window.history.pushState(null, '', window.location.href);
                console.log('🚫 Back button disabled - staying in chat session');
            };

            window.addEventListener('popstate', onPopState);

            return () => {
                window.removeEventListener('popstate', onPopState);
            };
        };

        return disableBackButton();
    }, []);

    useEffect(() => {
        return () => {
            if (socket && session && sessionId) {
                console.log(`🚪 Chat component unmounting - terminating session ${sessionId}`);
                socket.emit('terminate-session', {
                    sessionId,
                    reason: 'manual',
                    terminatedBy: session.myAnonymousName
                });
                localStorage.removeItem(`session_${sessionId}`);
            }
        };
    }, [socket, session, sessionId]);

    useEffect(() => {
        if (!socket || !session) return;

        const joined = d => {
            if (!connected) {
                setConnected(true);
                setTimeout(() => setConnected(false), 3000);
            }
            setPeers(d.allUsers.filter(n => n !== session.myAnonymousName));
        };

        const left = d => setPeers(p => p.filter(n => n !== d.userAnonymousName));

        const start = d => {
            if (d.sessionId !== sessionId) return;
            setStatus('active');
            setTime(Math.max(0, MAX_DURATION - Math.floor((Date.now() - d.startTime) / 1000)));
        };

        const end = d => {
            setStatus('ended');

            let message = 'Session ended';
            let icon = <FiAlertCircle className="text-xl" />;

            if (d.reason === 'disconnect') {
                message = `${d.terminatedBy} left the session`;
                icon = <FiWifiOff className="text-xl" />;
            } else if (d.reason === 'timeout') {
                message = 'Session timed out';
                icon = <FiClock className="text-xl" />;
            } else if (d.reason === 'manual') {
                message = `${d.terminatedBy} ended the session`;
                icon = <FiPhoneOff className="text-xl" />;
            }

            setTerm({ icon, message });

            setTimeout(() => {
                localStorage.removeItem(`session_${sessionId}`);
                navigate(ROUTES.DASHBOARD);
            }, 3000);
        };

        const msg = d => setMessages(m => [...m, {
            id: d.messageId,
            text: d.message,
            sender: d.senderName === session.myAnonymousName ? 'me' : 'partner',
            ts: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        const type = d => {
            if (d.senderName !== session.myAnonymousName) setTyping(d.typing);
        };

        const closed = () => end({ reason: 'closed', terminatedBy: 'System' });

        socket.on('user-joined-session', joined);
        socket.on('user-left-session', left);
        socket.on('session-started', start);
        socket.on('session-terminated', end);
        socket.on('receive-message', msg);
        socket.on('user-typing', type);
        socket.on('session-closed', closed);

        return () => {
            socket.off('user-joined-session', joined);
            socket.off('user-left-session', left);
            socket.off('session-started', start);
            socket.off('session-terminated', end);
            socket.off('receive-message', msg);
            socket.off('user-typing', type);
            socket.off('session-closed', closed);
        }
    }, [socket, session, sessionId, navigate, connected]);

    useEffect(() => {
        if (status !== 'active') return;
        timerRef.current = setInterval(() => setTime(t => {
            if (t <= 1) {
                socket.emit('terminate-session', {
                    sessionId,
                    reason: 'timeout',
                    terminatedBy: session.myAnonymousName
                });
                return 0;
            }
            return t - 1;
        }), 1000);
        return () => clearInterval(timerRef.current);
    }, [status, socket, session, sessionId]);

    useEffect(scroll, [messages]);

    const send = () => {
        if (!draft.trim() || status !== 'active') return;
        socket.emit('typing-stop', { sessionId, senderName: session.myAnonymousName });
        socket.emit('send-message', {
            sessionId,
            message: draft,
            senderName: session.myAnonymousName,
            timestamp: new Date().toISOString()
        });
        setDraft('');
        grow(textRef.current);
    };

    const dismissBanner = () => {
        setBannerDismissed(true);
    };

    const key = e => {
        if (e.key === 'Enter') {
            if (e.shiftKey) return;
            e.preventDefault();
            send();
        }
    };

    const change = e => {
        setDraft(e.target.value);
        grow(e.target);
        if (status !== 'active') return;
        socket.emit('typing-start', { sessionId, senderName: session.myAnonymousName });
        clearTimeout(typingRef.current);
        typingRef.current = setTimeout(() => socket.emit('typing-stop',
            { sessionId, senderName: session.myAnonymousName }), 1000);
    };

    const end = () => {
        socket.emit('terminate-session', {
            sessionId,
            reason: 'manual',
            terminatedBy: session.myAnonymousName
        });
        setStatus('ended');
    };

    if (!session) return (
        <div className="h-screen grid place-items-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading session...</p>
            </div>
        </div>
    );

    if (terminated) return (
        <div className="h-screen grid place-items-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {terminated.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Session Ended</h2>
                <p className="text-gray-600">{terminated.message}</p>
                <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">

            {connected && (
                <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg z-50 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                    <FiUsers className="text-sm sm:text-base" />
                    <span>🎉 Connection established!</span>
                </div>
            )}

            {banner && !bannerDismissed && (
                <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-b border-yellow-200 px-3 sm:px-4 py-1.5 sm:py-2 shrink-0">
                    <div className="max-w-6xl mx-auto flex items-center justify-between text-xs sm:text-sm text-amber-800">
                        <div className="flex items-center justify-center space-x-2 flex-1">
                            <FiAlertCircle className="text-sm flex-shrink-0" />
                            <span className="text-center">This is an anonymous chat session. Refreshing will disconnect both users.</span>
                        </div>
                        <button
                            onClick={dismissBanner}
                            className="ml-4 p-1 hover:bg-amber-200 rounded-full transition-colors duration-200 flex-shrink-0"
                            title="Dismiss"
                        >
                            <FiX className="text-sm" />
                        </button>
                    </div>
                </div>
            )}

            <header className="shrink-0 border-b border-white/30 bg-white/80 backdrop-blur-md shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                            {session.partnerName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-gray-900">
                                You: {session.myAnonymousName}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500">
                                Partner: {session.partnerName}
                            </p>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="hidden md:flex items-center text-xs sm:text-sm bg-emerald-50 text-emerald-700 rounded-full px-2 sm:px-3 py-1 border border-emerald-200">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mr-1 sm:mr-2 animate-pulse"></div>
                    Active Session
                </span>

                            <span className="flex items-center text-xs sm:text-sm space-x-1">
                    {isConnected ? (
                        <>
                            <FiWifi className="text-green-500 text-xs sm:text-sm" />
                            <span className="text-green-600">Connected</span>
                        </>
                    ) : (
                        <>
                            <FiWifiOff className="text-red-500 text-xs sm:text-sm" />
                            <span className="text-red-600">Disconnected</span>
                        </>
                    )}
                </span>
                        </div>
                    </div>

                    {status === 'active' && (
                        <div className="flex items-center gap-2 sm:gap-4">
                <span className={`border rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2 font-mono text-xs sm:text-sm font-semibold ${timeClr(timeLeft)} flex items-center`}>
                    <FiClock className="mr-1 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm">{fmt(timeLeft)}</span>
                </span>
                            <button
                                onClick={end}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-1 sm:space-x-2"
                            >
                                <FiPhoneOff className="text-xs sm:text-sm" />
                                <span>End Session</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>


            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/60 to-white">
                <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 px-3 sm:px-4 py-4 sm:py-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-16 sm:py-20">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                                <FiUsers className="text-white text-xl sm:text-3xl" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Start the conversation!</h3>
                            <p className="text-gray-500 text-sm sm:text-base">Send your first message to begin learning together.</p>
                        </div>
                    ) : (
                        messages.map(m => {
                            const me = m.sender === 'me';
                            return (
                                <div key={m.id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`group relative max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-200 ${
                                        me
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                            : 'bg-white text-gray-900 border border-gray-200'
                                    }`}>
                                        <button
                                            onClick={() => copy(m.text)}
                                            className="absolute -right-6 sm:-right-8 top-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all duration-200 p-1 rounded-md hover:bg-gray-100"
                                            title="Copy message"
                                        >
                                            <FiCopy className="text-xs sm:text-sm" />
                                        </button>
                                        <p className="whitespace-pre-wrap text-left leading-relaxed">{m.text}</p>
                                        <span className={`block text-[9px] sm:text-[10px] opacity-70 text-right mt-1 sm:mt-2 ${me ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {m.ts}
                                    </span>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {typing && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 max-w-[70%]">
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs sm:text-sm text-gray-600">Partner is typing</span>
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>
            </div>

            {copyFeedback && (
                <div className="fixed top-3 sm:top-4 right-3 sm:right-4 bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg z-50 animate-fade-in text-xs sm:text-sm">
                    {copyFeedback}
                </div>
            )}

            <form
                onSubmit={e => { e.preventDefault(); send(); }}
                className="shrink-0 border-t bg-white/90 backdrop-blur-md shadow-lg"
            >
                <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex-1 flex items-center justify-center px-1.5 sm:px-2 py-1.5 sm:py-2">
                    <textarea
                        ref={el => { textRef.current = el; grow(el); }}
                        rows={1}
                        value={draft}
                        onChange={change}
                        onKeyDown={key}
                        placeholder={status === 'active' ? 'Type a message...' : 'Waiting for session to start...'}
                        disabled={status !== 'active'}
                        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:cursor-not-allowed overflow-hidden transition-all duration-200"
                    />
                    </div>
                    <button
                        type="submit"
                        disabled={status !== 'active' || !draft.trim()}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:from-gray-300 disabled:to-gray-400 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 flex items-center justify-center"
                    >
                        <FiSend className="text-sm sm:text-lg" />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Chat;
