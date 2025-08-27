import axios from 'axios';
import {API_BASE_URL} from '../Constants/values.js';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const registerUser = async (data) => {
    return apiClient.post('/api/auth/register', data);
};

export const loginUser = async (data) => {
    return apiClient.post('/api/auth/login', data);
};

export const verifyToken = async () => {
    return apiClient.get('/api/auth/verify');
};

export const updateUserProfile = async (data) => {
    return apiClient.put('/api/users/profile', data);
};

export const findMatches = async (data) => {
    return apiClient.post('/api/matching/find-matches', data);
};

export const changePassword = (data) => {
    return apiClient.put('/api/users/change-password', data);
};

export const deleteAccount = (data) => {
    return apiClient.post('/api/users/delete-account', data);
}

export const cleanupMatchingPreferences = async () => {
    const response = await fetch(`${API_BASE_URL}/api/matching/cleanup-preferences`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};
