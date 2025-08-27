import { Link } from 'react-router-dom';
import { ROUTES } from '../Constants/values.js';

function WelcomeBar({ pageType = 'login' }) {
    const getNavigationContent = () => {
        if (pageType === 'register') {
            return {
                text: 'Already have an account?',
                linkText: 'Sign in',
                linkTo: ROUTES.LOGIN
            };
        }
        return {
            text: 'New here?',
            linkText: 'Sign up',
            linkTo: ROUTES.REGISTER
        };
    };

    const navContent = getNavigationContent();

    return (
        <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-18">
                    <Link to="/" className="flex items-center">
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200">
                            ByteSwap
                        </h1>
                    </Link>

                    <div className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                        <span className="text-gray-600 hidden sm:inline">{navContent.text}</span>
                        <span className="text-gray-400 hidden sm:inline">|</span>
                        <Link
                            to={navContent.linkTo}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 px-2 py-1 rounded-md hover:bg-blue-50"
                        >
                            {navContent.linkText}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default WelcomeBar;
