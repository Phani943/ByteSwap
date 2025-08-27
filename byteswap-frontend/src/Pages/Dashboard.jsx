import {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import SkillSelector from '../Dashboard/SkillSelector';
import {ROUTES} from '../Constants/values.js';
import {updateUserProfile} from '../Services/api';
import Navbar from '../Common/Navbar.jsx';

function Dashboard({isAuthenticated, setIsAuthenticated}) {
    const [user, setUser] = useState(null);
    const [skillsToTeach, setSkillsToTeach] = useState([]);
    const [skillsToLearn, setSkillsToLearn] = useState([]);
    const [isReadyToMatch, setIsReadyToMatch] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserData = () => {
            try {
                const userData = localStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    setSkillsToTeach(parsedUser.skillsTeaching || []);
                    setSkillsToLearn(parsedUser.skillsLearning || []);
                } else {
                    console.log('Dashboard - No user data, redirecting to login');
                    navigate(ROUTES.LOGIN);
                }
            } catch (error) {
                console.error('Dashboard - Error loading user data:', error);
                navigate(ROUTES.LOGIN);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    useEffect(() => {
        setIsReadyToMatch(skillsToTeach.length > 0 || skillsToLearn.length > 0);
    }, [skillsToTeach, skillsToLearn]);

    const handleSkillsUpdate = useCallback((teachSkills, learnSkills) => {
        setSkillsToTeach(teachSkills);
        setSkillsToLearn(learnSkills);
        setHasUnsavedChanges(true);

        setUser(prev => {
            const updated = {...prev, skillsTeaching: teachSkills, skillsLearning: learnSkills};
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const handleConnectMe = async () => {
        if (!isReadyToMatch) return;

        try {
            setSaving(true);

            await updateUserProfile({
                skillsTeaching: skillsToTeach,
                skillsLearning: skillsToLearn
            });

            console.log('✅ Skills saved to database');
            setHasUnsavedChanges(false);

            navigate(ROUTES.MATCHING, {state: {skillsToTeach, skillsToLearn}});
        } catch (err) {
            console.error('Failed to save skills', err);
            alert('Failed to save skills. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated}/>}
                <div className="flex items-center justify-center h-96">
                    <div className="matching-loader"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated}/>}

            <main className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-6 pt-16">
                <header>
                    <div className="pt-4 pl-1 flex items-center">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                            Welcome, {user?.name || 'User'}
                        </h1>
                    </div>
                </header>

                <section>
                    <div
                        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/20 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5">
                            <div
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                                    Configure Your Skills
                                </h2>
                                <p className="text-blue-100 text-xs sm:text-sm lg:text-base">
                                    Set what you can teach and what you want to learn
                                </p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            <SkillSelector
                                initialTeachSkills={skillsToTeach}
                                initialLearnSkills={skillsToLearn}
                                onSkillsUpdate={handleSkillsUpdate}
                                isReadyToMatch={isReadyToMatch}
                                hasUnsavedChanges={hasUnsavedChanges}
                                saving={saving}
                                onConnect={handleConnectMe}
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <div
                        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-md border border-blue-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                                    How ByteSwap Works
                                </h3>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {[
                                    {text: 'Select skills you can teach and want to learn'},
                                    {text: 'Get matched to someone with complementary skills'},
                                    {text: 'Start an anonymous 30-minute learning session'},
                                ].map((step, i) => (
                                    <div key={i}
                                         className="flex flex-col items-center text-center p-4 sm:p-6 bg-white rounded-xl shadow-sm">
                                        <div
                                            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                                            {i + 1}
                                        </div>
                                        <p className="text-gray-700 font-medium text-sm sm:text-base leading-relaxed">
                                            {step.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
