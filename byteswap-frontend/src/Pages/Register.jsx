import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ROUTES} from '../Constants/values.js';
import {registerUser} from '../Services/api';
import WelcomeBar from "../Common/WelcomeBar.jsx";
import {FaEye, FaEyeSlash, FaUserPlus, FaHandshake, FaRocket} from "react-icons/fa";
import "../Pages-Css/Register.css";

function Register({setIsAuthenticated}) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validateForm = () => {
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const response = await registerUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
            });

            const {token, user} = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setIsAuthenticated(true);
            navigate(ROUTES.DASHBOARD);
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed');
        }

        setLoading(false);
    };

    const steps = [
        {
            icon: <FaUserPlus/>,
            text: 'Select skills you can teach and want to learn'
        },
        {
            icon: <FaHandshake/>,
            text: 'Get matched to someone with complementary skills'
        },
        {
            icon: <FaRocket/>,
            text: 'Start an anonymous 30-minute learning session'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
            <WelcomeBar pageType="register"/>

            <div className="flex-1 flex items-center justify-center py-4 lg:py-6">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start lg:items-center">

                        <div className="space-y-4 lg:space-y-6 order-1">
                            <div className="text-center lg:text-left">
                                <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 lg:mb-3">
                                    Join <span
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">ByteSwap</span>
                                </h1>
                                <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4 lg:mb-6">
                                    Your journey to mastery starts here
                                </p>
                            </div>

                            <div
                                className="hidden lg:block bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3">
                                    <h3 className="text-lg font-bold text-white">How ByteSwap Works</h3>
                                </div>
                                <div className="p-5">
                                    <div className="space-y-4">
                                        {steps.map((step, i) => (
                                            <div key={i} className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div
                                                        className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-full flex items-center justify-center text-base font-bold">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                                <div className="flex-1 pt-1.5">
                                                    <p className="text-gray-700 font-medium text-sm leading-relaxed">
                                                        {step.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-2">
                            <div
                                className="bg-white py-6 sm:py-8 px-5 sm:px-7 shadow-xl rounded-2xl border border-gray-100 max-w-md mx-auto lg:max-w-none">
                                <div className="text-center mb-5">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                                        Create Account
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        Start your learning adventure today
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div className="input-group">
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder=" "
                                        />
                                        <label htmlFor="name">Full Name</label>
                                    </div>

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

                                    <div className="input-group relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder=" "
                                        />
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                        >
                                            {showConfirmPassword ? <FaEyeSlash size={16}/> : <FaEye size={16}/>}
                                        </button>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex justify-center py-2.5 sm:py-3 px-4 rounded-xl shadow-lg text-base font-semibold text-white
                                            bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                                            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                                            transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {loading ? (
                                                <div className="matching-loader w-5 h-5"></div>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                                            <p className="text-red-600 text-sm text-center">
                                                {error}
                                            </p>
                                        </div>
                                    )}

                                    <div className="text-center pt-3 border-t border-gray-100">
                                        <span className="text-sm text-gray-600">
                                            Already have an account?{' '}
                                            <Link
                                                to={ROUTES.LOGIN}
                                                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors duration-200"
                                            >
                                                Sign in here
                                            </Link>
                                        </span>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="lg:hidden mt-6">
                        <div
                            className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden max-w-md mx-auto">
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3">
                                <h3 className="text-lg font-bold text-white">How ByteSwap Works</h3>
                            </div>
                            <div className="p-5">
                                <div className="space-y-4">
                                    {steps.map((step, i) => (
                                        <div key={i} className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-full flex items-center justify-center text-base font-bold">
                                                    {i + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 pt-1.5">
                                                <p className="text-gray-700 font-medium text-sm leading-relaxed">
                                                    {step.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
