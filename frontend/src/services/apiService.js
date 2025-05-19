// frontend/src/services/apiService.js
import { ErrorContext } from "../App";

const API_BASE_URL = "http://localhost:8000";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const setError = ErrorContext._currentValue;
    setError("Nie masz dostępu do tej funkcji.");
    throw new Error("Unauthorized");
  }


  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};