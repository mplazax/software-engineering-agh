export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Używamy prostego endpointu, Nginx zajmie się resztą
  const requestUrl = `/api${endpoint}`;

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
