import React, { useState, useMemo, useCallback } from "react";
import { Container, Stack, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import { useQuery } from "@tanstack/react-query";

import { useCrud } from "../hooks/useCrud";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import GroupFormDialog from "../features/Admin/GroupFormDialog";
import { apiRequest } from "../api/apiService";

const useUsersMap = () => {
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest("/users"),
  });
  return useMemo(
    () => new Map(users.map((u) => [u.id, `${u.name} ${u.surname}`])),
    [users]
  );
};

const GroupsPage = () => {
  const {
    items: groups,
    isLoading,
    isError,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud("groups", "/groups");
  const usersMap = useUsersMap();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);

  const handleAdd = () => {
    setCurrentGroup(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((group) => {
    setCurrentGroup(group);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Czy na pewno chcesz usunąć tę grupę?")) {
        await deleteItem(id).catch((e) => alert(`Błąd: ${e.message}`));
      }
    },
    [deleteItem]
  );

  const handleSave = async (groupData) => {
    try {
      if (currentGroup) {
        await updateItem({ id: currentGroup.id, updatedItem: groupData });
      } else {
        await createItem(groupData);
      }
      setDialogOpen(false);
    } catch (e) {
      console.error("Save failed", e);
      return e;
    }
  };

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      {
        field: "name",
        headerName: "Nazwa Grupy",
        width: 250,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <GroupIcon sx={{ mr: 1, color: "text.secondary" }} />
            {params.value}
          </Box>
        ),
      },
      { field: "year", headerName: "Rok", type: "number", width: 100 },
      {
        field: "leader_id",
        headerName: "Starosta",
        flex: 1,
        valueGetter: (value) => usersMap.get(value) || "Nieznany",
      },
      {
        field: "actions",
        headerName: "Akcje",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [usersMap, handleEdit, handleDelete]
  );

  return (
    <Container maxWidth="lg" sx={{ p: "0 !important" }}>
      <AdminDataGrid
        columns={columns}
        rows={groups}
        isLoading={isLoading || usersMap.size === 0}
        isError={isError}
        error={error}
        onAddItem={handleAdd}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po nazwie grupy...",
          addLabel: "Dodaj Grupę",
        }}
      />
      <GroupFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        group={currentGroup}
      />
    </Container>
  );
};

export default GroupsPage;
