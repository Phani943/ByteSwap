import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ROUTES} from '../Constants/values.js';
import {loginUser} from '../Services/api';
import WelcomeBar from "../Common/WelcomeBar.jsx";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import "../Pages-Css/Login.css";

function Login({setIsAuthenticated}) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        try {
            const response = await loginUser({
                email: formData.email,
                password: formData.password,
            });

            const {token, user} = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setIsAuthenticated(true);
            navigate(ROUTES.DASHBOARD);
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
            <WelcomeBar pageType="login"/>

            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Sign in to continue your learning journey
                        </p>
                    </div>

                    <div className="bg-white py-8 sm:py-10 px-6 sm:px-8 shadow-xl rounded-2xl border border-gray-100">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder=" "
                                />
                                <label htmlFor="email">Email Address</label>
                            </div>

                            <div className="input-group relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder=" "
                                />
                                <label htmlFor="password">Password</label>

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    {showPassword ? <FaEyeSlash size={16}/> : <FaEye size={16}/>}
                                </button>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-base font-semibold text-white
                                    bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                    transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="matching-loader w-5 h-5"></div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-600 text-sm text-center">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <div className="text-center pt-4 border-t border-gray-100">
                                <span className="text-sm sm:text-base text-gray-600">
                                    Don't have an account?{' '}
                                    <Link
                                        to={ROUTES.REGISTER}
                                        className="font-semibold text-purple-600 hover:text-purple-700 transition-colors duration-200"
                                    >
                                        Sign up here
                                    </Link>
                                </span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
