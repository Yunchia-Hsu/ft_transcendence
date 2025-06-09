import axios from 'axios';

const API_URL = 'http://your-api-url.com/api/auth/';

export const login = async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}login`, { username, password });
    return response.data;
};

export const logout = async () => {
    await axios.post(`${API_URL}logout`);
};

export const register = async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}register`, { username, password });
    return response.data;
};