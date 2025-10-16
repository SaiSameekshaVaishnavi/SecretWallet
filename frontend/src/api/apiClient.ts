// src/api/apiClient.ts
import axios from "axios";

const API_BASE_URL = "https://secretwallet.onrender.com/api"; // Change if deployed

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token (if exists)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
