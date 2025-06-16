import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService";

export const useCrud = (resourceName, endpoint) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [resourceName],
    queryFn: () => apiRequest(endpoint),
  });

  const invalidateQuery = () => {
    queryClient.invalidateQueries({ queryKey: [resourceName] });
  };

  const createMutation = useMutation({
    mutationFn: (newItem) =>
      apiRequest(endpoint, { method: "POST", body: JSON.stringify(newItem) }),
    onSuccess: invalidateQuery,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedItem }) =>
      apiRequest(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedItem),
      }),
    onSuccess: invalidateQuery,
  });

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
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
