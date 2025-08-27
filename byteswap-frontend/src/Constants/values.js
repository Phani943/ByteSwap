export const popularSkills = [
    "React", "Node.js Basics", "Machine Learning", "Deep Learning",
    "LLM Fine-tuning", "Python", "JavaScript", "MongoDB", "Express.js",
    "Computer Vision", "PyTorch", "TensorFlow", "Git"
];

export const SESSION_DURATION = 30;
export const MATCHING_TIMEOUT = 30;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://byteswap-backend.onrender.com';

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    MATCHING: '/matching',
    CHAT: '/chat',
    PROFILE: '/profile'
};

export function createUserName() {
    const animals     = ['wolf', 'fox', 'bear', 'eagle', 'lion', 'tiger', 'dolphin', 'shark'];
    const adjectives  = ['clever', 'brave', 'swift', 'mighty', 'wise', 'bold', 'fierce', 'noble'];

    const rand = (max) => Math.floor(Math.random() * max);

    const adjective = adjectives[rand(adjectives.length)];
    const animal    = animals[rand(animals.length)];
    const number    = rand(100).toString().padStart(2, '0');

    return `${adjective}_${animal}_${number}`;
}
