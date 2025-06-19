import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService.js";
import { useNotification } from "../contexts/NotificationContext.jsx";

export const useCrud = (
    resourceName,
    endpoint,
    // ZMIANA: Zamiast `options` z domyślnym `runQuery`, destrukuryzujemy opcje
    { runQuery = true, queryEndpoint = endpoint } = {}
) => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [resourceName],
    // ZMIANA: Używamy `queryEndpoint` do pobierania danych
    queryFn: () => apiRequest(queryEndpoint),
    enabled: runQuery,
  });

  const invalidateQuery = () => {
    queryClient.invalidateQueries({ queryKey: [resourceName] });
  };

  const mutationOptions = (action) => ({
    onSuccess: () => {
      invalidateQuery();
      showNotification(`Element został pomyślnie ${action}.`, "success");
    },
    onError: (err) => {
      const errorMessage = err.message || "Wystąpił nieznany błąd";
      showNotification(`Błąd operacji: ${errorMessage}`, "error");
      // Rzucamy błąd dalej, aby formularz mógł go obsłużyć
      throw err;
    },
  });

  const createMutation = useMutation({
    // Endpoint do mutacji pozostaje bez zmian
    mutationFn: (newItem) =>
        apiRequest(endpoint, { method: "POST", body: JSON.stringify(newItem) }),
    ...mutationOptions("utworzony"),
  });

  const updateMutation = useMutation({
    // Endpoint do mutacji pozostaje bez zmian
    mutationFn: ({ id, updatedItem }) =>
        apiRequest(`${endpoint}/${id}`, {
          method: "PUT",
          body: JSON.stringify(updatedItem),
        }),
    ...mutationOptions("zaktualizowany"),
  });

  const deleteMutation = useMutation({
    // Endpoint do mutacji pozostaje bez zmian
    mutationFn: (id) => apiRequest(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateQuery();
      showNotification("Element został pomyślnie usunięty.", "success");
    },
    onError: (err) => {
      const errorMessage = err.message || "Wystąpił nieznany błąd";
      showNotification(`Błąd usuwania: ${errorMessage}`, "error");
      throw err;
    },
  });

  return {
    items: data || [],
    isLoading,
    isError,
    error,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};