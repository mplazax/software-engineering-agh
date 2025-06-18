import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService.js";
import { useNotification } from "../contexts/NotificationContext.jsx";

export const useCrud = (resourceName, endpoint) => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [resourceName],
    queryFn: () => apiRequest(endpoint),
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
      showNotification(`Błąd operacji: ${err.message}`, "error");
    },
  });

  const createMutation = useMutation({
    mutationFn: (newItem) =>
      apiRequest(endpoint, { method: "POST", body: JSON.stringify(newItem) }),
    ...mutationOptions("utworzony"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedItem }) =>
      apiRequest(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedItem),
      }),
    ...mutationOptions("zaktualizowany"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateQuery();
      showNotification("Element został pomyślnie usunięty.", "success");
    },
    onError: (err) => {
      showNotification(`Błąd usuwania: ${err.message}`, "error");
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
