import { queryClient } from "../App";

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

  // ✅ Wyczyść cache po zmianie użytkownika
  queryClient.clear();

  return data;
};

export const logout = () => {
  localStorage.removeItem("token");

  // ✅ Czyść dane po wylogowaniu
  queryClient.clear();
};
