import {useState, useEffect} from 'react';
import {popularSkills} from '../Constants/values.js';

const SkillSelector = ({
                           initialTeachSkills = [],
                           initialLearnSkills = [],
                           onSkillsUpdate,
                           isReadyToMatch,
                           hasUnsavedChanges,
                           saving,
                           onConnect
                       }) => {
    const [teachSkills, setTeachSkills] = useState(initialTeachSkills);
    const [learnSkills, setLearnSkills] = useState(initialLearnSkills);
    const [customTeachSkill, setCustomTeachSkill] = useState('');
    const [customLearnSkill, setCustomLearnSkill] = useState('');
    const [activeTab, setActiveTab] = useState('teach');

    useEffect(() => {
        onSkillsUpdate(teachSkills, learnSkills);
    }, [teachSkills, learnSkills, onSkillsUpdate]);

    const addSkillToTeach = (skill) => {
        if (!teachSkills.includes(skill) && !learnSkills.includes(skill)) {
            setTeachSkills([...teachSkills, skill]);
        }
    };

    const addSkillToLearn = (skill) => {
        if (!learnSkills.includes(skill) && !teachSkills.includes(skill)) {
            setLearnSkills([...learnSkills, skill]);
        }
    };

    const removeSkillFromTeach = (skill) => {
        setTeachSkills(teachSkills.filter((s) => s !== skill));
    };

    const removeSkillFromLearn = (skill) => {
        setLearnSkills(learnSkills.filter((s) => s !== skill));
    };

    const handleCustomTeachSubmit = (e) => {
        e.preventDefault();
        if (
            customTeachSkill.trim() &&
            !teachSkills.includes(customTeachSkill.trim()) &&
            !learnSkills.includes(customTeachSkill.trim())
        ) {
            addSkillToTeach(customTeachSkill.trim());
            setCustomTeachSkill('');
        }
    };

    const handleCustomLearnSubmit = (e) => {
        e.preventDefault();
        if (
            customLearnSkill.trim() &&
            !learnSkills.includes(customLearnSkill.trim()) &&
            !teachSkills.includes(customLearnSkill.trim())
        ) {
            addSkillToLearn(customLearnSkill.trim());
            setCustomLearnSkill('');
        }
    };

    const getAvailableSkills = (excluding) =>
        popularSkills.filter(
            (skill) =>
                !teachSkills.includes(skill) &&
                !learnSkills.includes(skill) &&
                !excluding.includes(skill)
        );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7 space-y-6">
                <div className="relative">
                    <div
                        className="flex bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-2xl p-1.5 relative shadow-inner">
                        <div
                            className={`absolute inset-0 w-1/2 rounded-xl shadow-lg transition-all duration-300 ease-out ${
                                activeTab === 'learn'
                                    ? 'translate-x-full bg-gradient-to-r from-green-500 to-emerald-600'
                                    : 'translate-x-0 bg-gradient-to-r from-blue-500 to-purple-600'
                            }`}
                        />
                        <button
                            onClick={() => setActiveTab('teach')}
                            className={`relative z-10 flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-colors duration-200 ${
                                activeTab === 'teach'
                                    ? 'text-white'
                                    : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <span>I Can Teach</span>
                                {teachSkills.length > 0 && (
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full min-w-[20px] ${
                                            activeTab === 'teach'
                                                ? 'bg-white bg-opacity-30 text-white'
                                                : 'bg-blue-500 text-white'
                                        }`}
                                    >
                                        {teachSkills.length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('learn')}
                            className={`relative z-10 flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-colors duration-200 ${
                                activeTab === 'learn'
                                    ? 'text-white'
                                    : 'text-gray-700 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <span>I Want to Learn</span>
                                {learnSkills.length > 0 && (
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full min-w-[20px] ${
                                            activeTab === 'learn'
                                                ? 'bg-white bg-opacity-30 text-white'
                                                : 'bg-green-500 text-white'
                                        }`}
                                    >
                                        {learnSkills.length}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                <div className="relative z-10">
                    {activeTab === 'teach' && (
                        <div className="space-y-6">
                            {teachSkills.length > 0 && (
                                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <h4 className="text-lg font-bold text-blue-800">
                                            Your Teaching Skills
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {teachSkills.map((skill, index) => (
                                            <div
                                                key={skill}
                                                className="group bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                                style={{
                                                    animationDelay: `${index * 50}ms`,
                                                    animation: 'slideInUp 0.3s ease-out forwards'
                                                }}
                                            >
                                                <span>{skill}</span>
                                                <button
                                                    onClick={() => removeSkillFromTeach(skill)}
                                                    className="w-5 h-5 bg-blue-500 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors duration-200 group-hover:scale-110"
                                                >
                                                    <svg
                                                        className="w-3 h-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 max-w-full overflow-hidden">
                                <h4 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                                    <svg
                                        className="w-5 h-5 text-blue-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                    </svg>
                                    <span>Popular Skills to Teach</span>
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {getAvailableSkills(teachSkills)
                                        .slice(0, 25)
                                        .map((skill, index) => (
                                            <button
                                                key={skill}
                                                onClick={() => addSkillToTeach(skill)}
                                                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 text-sm"
                                                style={{
                                                    animationDelay: `${index * 30}ms`,
                                                    animation: 'fadeIn 0.4s ease-out forwards'
                                                }}
                                            >
                                                + {skill}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'learn' && (
                        <div className="space-y-6">
                            {learnSkills.length > 0 && (
                                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <h4 className="text-lg font-bold text-green-800">
                                            Skills You Want to Learn
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {learnSkills.map((skill, index) => (
                                            <div
                                                key={skill}
                                                className="group bg-green-600 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                                                style={{
                                                    animationDelay: `${index * 50}ms`,
                                                    animation: 'slideInUp 0.3s ease-out forwards'
                                                }}
                                            >
                                                <span>{skill}</span>
                                                <button
                                                    onClick={() => removeSkillFromLearn(skill)}
                                                    className="w-5 h-5 bg-green-500 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors duration-200 group-hover:scale-110"
                                                >
                                                    <svg
                                                        className="w-3 h-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 max-w-full overflow-hidden">
                                <h4 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                                    <svg
                                        className="w-5 h-5 text-green-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                                    </svg>
                                    <span>Popular Skills to Learn</span>
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {getAvailableSkills(learnSkills)
                                        .slice(0, 25)
                                        .map((skill, index) => (
                                            <button
                                                key={skill}
                                                onClick={() => addSkillToLearn(skill)}
                                                className="bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 text-sm"
                                                style={{
                                                    animationDelay: `${index * 30}ms`,
                                                    animation: 'fadeIn 0.4s ease-out forwards'
                                                }}
                                            >
                                                + {skill}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 h-fit">
                    <h4 className="text-sm font-bold text-gray-800 mb-10 flex items-center space-x-2">
                        <svg
                            className={`w-4 h-4 ${
                                activeTab === 'teach' ? 'text-blue-500' : 'text-green-500'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        <span>Add Custom</span>
                    </h4>

                    {activeTab === 'teach' && (
                        <form onSubmit={handleCustomTeachSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={customTeachSkill}
                                onChange={(e) => setCustomTeachSkill(e.target.value)}
                                placeholder="Enter skill you can teach..."
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                            />
                            <button
                                type="submit"
                                disabled={!customTeachSkill.trim()}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 hover:shadow-md text-sm"
                            >
                                Add Skill
                            </button>
                        </form>
                    )}

                    {activeTab === 'learn' && (
                        <form onSubmit={handleCustomLearnSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={customLearnSkill}
                                onChange={(e) => setCustomLearnSkill(e.target.value)}
                                placeholder="Enter skill you want to learn..."
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200"
                            />
                            <button
                                type="submit"
                                disabled={!customLearnSkill.trim()}
                                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 hover:shadow-md text-sm"
                            >
                                Add Skill
                            </button>
                        </form>
                    )}
                </div>

                <div
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4">
                        <div className="text-center space-y-3">
                            <button
                                onClick={onConnect}
                                disabled={!isReadyToMatch || saving}
                                className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-md ${
                                    isReadyToMatch && !saving
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/25'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                                }`}
                            >
                                {saving ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div
                                            className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </div>
                                ) : isReadyToMatch ? (
                                    'Connect Me! 🚀'
                                ) : (
                                    'Set Skills First'
                                )}
                            </button>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Ready to Connect?
                                </h3>
                                <p className="text-gray-600 text-xs">
                                    {isReadyToMatch
                                        ? hasUnsavedChanges
                                            ? "Your skills will be saved and you'll be matched!"
                                            : 'Find someone to exchange knowledge with!'
                                        : 'Select at least one skill to teach or learn to get started.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default SkillSelector;
