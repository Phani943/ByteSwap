import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../Constants/values.js';

function getDisplayUser(raw) {
    if (!raw) return { name: 'User', email: '', initial: 'U' };
    const name  = raw.name  || raw.username  || raw.fullName  || raw.displayName || '';
    const email = raw.email || '';
    const displayName = name || (email ? email.split('@')[0] : 'User');
    return { name: displayName, email, initial: displayName.charAt(0).toUpperCase() };
}

const Navbar = ({ setIsAuthenticated }) => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const menuRef = useRef(null);
    const btnRef  = useRef(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('user');
            setUser(raw ? JSON.parse(raw) : null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        const onClick = (e) => {
            if (!showMenu) return;
            if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
            setShowMenu(false);
        };
        const onEsc = (e) => e.key === 'Escape' && setShowMenu(false);
        document.addEventListener('click', onClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [showMenu]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        typeof setIsAuthenticated === 'function' && setIsAuthenticated(false);
        navigate(ROUTES.LOGIN);
    };

    const { name, email, initial } = getDisplayUser(user);

    if (loading) {
        return (
            <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200">
                        ByteSwap
                    </h1>
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 fixed top-0 left-0 w-full z-50">
            <div className="mx-2 px-2 sm:px-4 lg:px-6 h-16 flex items-center justify-between">
                <h1
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                >
                    ByteSwap
                </h1>

                <div className="flex items-center space-x-4">
                    <span className="hidden md:block text-sm font-bold text-gray-700">
                        Hello, {name}
                    </span>

                    <div className="relative">
                        <button
                            ref={btnRef}
                            onClick={() => setShowMenu((v) => !v)}
                            className="group focus:outline-none"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white font-bold flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                                {initial}
                            </div>
                        </button>

                        {showMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 mt-2 w-56 bg-white backdrop-blur-md rounded-xl shadow-xl border border-white/20 py-2 z-50"
                            >
                                <button
                                    onClick={() => {
                                        navigate(ROUTES.PROFILE);
                                        setShowMenu(false);
                                    }}
                                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                >
                                    Profile Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                                >
                                    Sign Out
                                </button>

                                <div className="border-t px-4 py-2 text-xs text-gray-400">
                                    Signed in as <span className="font-medium">{email}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
