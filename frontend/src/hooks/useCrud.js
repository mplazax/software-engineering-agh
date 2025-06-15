import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService";

/**
 * Generyczny hook do operacji CRUD na zasobach API.
 * @param {string} resourceName - Nazwa zasobu, np. 'users', 'rooms'. Używana jako klucz zapytania.
 * @param {string} endpoint - Główny endpoint API dla zasobu, np. '/users'.
 */
export const useCrud = (resourceName, endpoint) => {
  const queryClient = useQueryClient();

  // READ (Pobieranie listy)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [resourceName],
    queryFn: () => apiRequest(endpoint),
  });

  // Funkcja do unieważniania zapytania, aby odświeżyć dane po mutacji
  const invalidateQuery = () => {
    queryClient.invalidateQueries({ queryKey: [resourceName] });
  };

  // CREATE
  const createMutation = useMutation({
    mutationFn: (newItem) =>
      apiRequest(endpoint, { method: "POST", body: JSON.stringify(newItem) }),
    onSuccess: invalidateQuery,
  });

  // UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, updatedItem }) =>
      apiRequest(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedItem),
      }),
    onSuccess: invalidateQuery,
  });

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: invalidateQuery,
  });

  return {
    items: data || [],
    isLoading,
    isError,
    error,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    // Przekazujemy również stany mutacji dla lepszej kontroli w UI
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
