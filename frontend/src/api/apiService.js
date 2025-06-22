const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Budujemy pełny, absolutny URL
  const requestUrl = `${API_BASE_URL}/api${endpoint}`;

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(errorData.detail || "An unknown error occurred.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
