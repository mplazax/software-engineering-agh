import { apiRequest } from "./apiService";

export const login = async (email, password) => {
  const response = await fetch(`/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password: password }),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Nieprawidłowe dane" }));
    throw new Error(errorData.detail);
  }
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const isAuthenticated = () => !!localStorage.getItem("token");

export const getCurrentUser = async () => {
  return apiRequest("/auth/me");
};
