import axios from "axios";
import { API_URL } from "../utils/misc.jsx";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        Accept: "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;