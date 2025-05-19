import { apiRequest } from "./apiService";

const API_URL = "http://localhost:8000/auth";

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!response.ok) throw new Error("Invalid credentials");
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const isAuthenticated = () => !!localStorage.getItem("token");

export const getCurrentUser = async () => {
  const response = await apiRequest("/auth/me", {
    method: "GET",
  });
  return response.json();
};