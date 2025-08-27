import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    FaKey,
    FaTrashAlt,
    FaUserCircle,
    FaCheck,
    FaTimes,
    FaEye,
    FaEyeSlash,
    FaExclamationTriangle
} from 'react-icons/fa';
import {HiShieldCheck} from 'react-icons/hi';
import Navbar from '../Common/Navbar.jsx';
import {changePassword, deleteAccount} from '../Services/api';
import {ROUTES} from '../Constants/values.js';

const Profile = ({setIsAuthenticated}) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [panel, setPanel] = useState(null);
    const [pwd, setPwd] = useState({current: '', newPass: ''});
    const [busy, setBusy] = useState(false);
    const [showPasswords, setShowPasswords] = useState({current: false, newPass: false});
    const [notification, setNotification] = useState(null);

    const toggle = name => setPanel(panel === name ? null : name);
    const onChange = e => setPwd({...pwd, [e.target.name]: e.target.value});
    const togglePasswordVisibility = field =>
        setShowPasswords(prev => ({...prev, [field]: !prev[field]}));

    const showNotification = (message, type = 'success') => {
        setNotification({message, type});
        setTimeout(() => setNotification(null), 4000);
    };

    const savePwd = async e => {
        e.preventDefault();
        setBusy(true);
        try {
            await changePassword({currentPassword: pwd.current, newPassword: pwd.newPass});
            showNotification('Password updated successfully!');
            setPanel(null);
            setPwd({current: '', newPass: ''});
        } catch (err) {
            showNotification(err.response?.data?.message || err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const removeAccount = async () => {
        if (!window.confirm('Delete account permanently?')) return;
        if (!pwd.current) {
            showNotification('Enter current password to confirm', 'error');
            return;
        }

        setBusy(true);
        try {
            await deleteAccount({currentPassword: pwd.current});
            localStorage.clear();
            typeof setIsAuthenticated === 'function' && setIsAuthenticated(false);
            showNotification('Account deleted successfully');
            navigate(ROUTES.LOGIN);
        } catch (err) {
            showNotification(err.response?.data?.message || err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
                <div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
            </div>

            <Navbar setIsAuthenticated={setIsAuthenticated}/>

            {notification && (
                <div
                    className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform ${
                        notification.type === 'success'
                            ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                            : 'bg-red-500/90 text-white border-red-400/50'
                    }`}>
                    <div className="flex items-center space-x-3">
                        {notification.type === 'success' ? <FaCheck/> : <FaTimes/>}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                </div>
            )}

            <div
                className="relative z-10 flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 gap-8 pt-28">
                <aside className="lg:w-80 w-full">
                    <div className="sticky top-24 space-y-6">
                        <div
                            className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative group">
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                    <FaUserCircle className="relative w-24 h-24 text-blue-600"/>
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h1>
                                    <p className="text-gray-600 text-sm break-all px-4 py-2 bg-gray-100/80 rounded-full">
                                        {user.email}
                                    </p>
                                </div>
                                <div
                                    className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                                    <HiShieldCheck className="w-4 h-4"/>
                                    <span className="text-sm font-medium">Verified Account</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 space-y-8">
                    <div className="group relative">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <section
                            className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <header
                                className="relative px-8 py-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                                <div className="relative flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white flex items-center space-x-3">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                            <FaKey className="w-4 h-4"/>
                                        </div>
                                        <span>Change Password</span>
                                    </h2>
                                    <button
                                        onClick={() => toggle('pwd')}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                                    >
                                        {panel === 'pwd' ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                            </header>

                            {panel === 'pwd' && (
                                <form onSubmit={savePwd} className="p-8 space-y-6 opacity-0 animate-fade-in">
                                    <div className="space-y-5">
                                        <div className="relative group">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                name="current"
                                                value={pwd.current}
                                                onChange={onChange}
                                                placeholder="Enter your current password"
                                                required
                                                className="w-full px-4 py-3 pr-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-white hover:border-gray-300 shadow-sm group-hover:shadow-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute right-3 top-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            >
                                                {showPasswords.current ? <FaEyeSlash className="w-4 h-4"/> :
                                                    <FaEye className="w-4 h-4"/>}
                                            </button>
                                        </div>

                                        <div className="relative group">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type={showPasswords.newPass ? "text" : "password"}
                                                name="newPass"
                                                value={pwd.newPass}
                                                onChange={onChange}
                                                placeholder="Enter your new password (min 6 characters)"
                                                minLength={6}
                                                required
                                                className="w-full px-4 py-3 pr-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-white hover:border-gray-300 shadow-sm group-hover:shadow-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('newPass')}
                                                className="absolute right-3 top-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            >
                                                {showPasswords.newPass ? <FaEyeSlash className="w-4 h-4"/> :
                                                    <FaEye className="w-4 h-4"/>}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {busy ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <div
                                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Updating Password...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center space-x-2">
                                                <FaCheck className="w-4 h-4"/>
                                                <span>Update Password</span>
                                            </div>
                                        )}
                                    </button>
                                </form>
                            )}
                        </section>
                    </div>

                    <div className="group relative">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <section
                            className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                            <header
                                className="relative px-8 py-6 bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                                <div className="relative flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white flex items-center space-x-3">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                            <FaTrashAlt className="w-4 h-4"/>
                                        </div>
                                        <span>Delete Account</span>
                                    </h2>
                                    <button
                                        onClick={() => toggle('del')}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                                    >
                                        {panel === 'del' ? 'Cancel' : 'Delete'}
                                    </button>
                                </div>
                            </header>

                            {panel === 'del' && (
                                <div className="p-8 space-y-6 opacity-0 animate-fade-in">
                                    <div
                                        className="flex-col items-start space-x-4 p-4 bg-red-50/80 border border-red-200/60 rounded-2xl space-y-2">
                                        <div className="flex items-center justify-center space-x-2">
                                            <FaExclamationTriangle
                                                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"/>
                                            <h4 className="font-semibold text-red-900">This action cannot be undone</h4>
                                        </div>
                                        <p className="text-sm text-red-700">
                                            This will permanently delete your account and all associated data.
                                        </p>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            name="current"
                                            value={pwd.current}
                                            onChange={onChange}
                                            placeholder="Enter current password to confirm deletion"
                                            required
                                            className="w-full px-4 py-3 pr-12 bg-white/90 backdrop-blur-sm border border-red-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 hover:bg-white hover:border-red-300 shadow-sm group-hover:shadow-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                            {showPasswords.current ? <FaEyeSlash className="w-4 h-4"/> :
                                                <FaEye className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                    <button
                                        onClick={removeAccount}
                                        disabled={busy}
                                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                    >
                                        {busy ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <div
                                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Deleting Account...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center space-x-2">
                                                <FaTrashAlt className="w-4 h-4"/>
                                                <span>Delete My Account</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { 
                    animation: fade-in 0.4s ease-out forwards; 
                }
            `}</style>
        </div>
    );
};

export default Profile;
