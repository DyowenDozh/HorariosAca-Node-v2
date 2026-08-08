// API Service - Handles HTTP requests to the backend
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Auth endpoints
export const loginUser = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
};

export const registerUser = async (nombre, email, password) => {
    const response = await axios.post(`${API_URL}/auth/register`, { nombre, email, password });
    return response.data;
};

// Protected endpoints - require token
export const getTeachers = async () => {
    const response = await axios.get(`${API_URL}/teachers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};