import React, { useState, useMemo, useCallback } from "react";
import { Container, Stack, IconButton, Avatar } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";

import { useCrud } from "../hooks/useCrud";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import UserFormDialog from "../features/Admin/UserFormDialog";

const roleTranslations = {
  ADMIN: "Administrator",
  KOORDYNATOR: "Koordynator",
  PROWADZACY: "Prowadzący",
  STAROSTA: "Starosta",
};

const UsersPage = () => {
  const {
    items: users,
    isLoading,
    isError,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud("users", "/users");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleAdd = () => {
    setCurrentUser(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((user) => {
    setCurrentUser(user);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) {
        try {
          await deleteItem(id);
        } catch (e) {
          alert(`Błąd: ${e.message}`);
        }
      }
    },
    [deleteItem]
  );

  const handleSave = async (userData) => {
    try {
      if (currentUser) {
        const payload = { ...userData };
        if (!payload.password) {
          delete payload.password;
        }
        await updateItem({ id: currentUser.id, updatedItem: payload });
      } else {
        await createItem(userData, { endpoint: "/users/create" });
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
        field: "avatar",
        headerName: "Avatar",
        width: 70,
        renderCell: () => (
          <Avatar>
            <PersonIcon />
          </Avatar>
        ),
        sortable: false,
      },
      { field: "name", headerName: "Imię", width: 150 },
      { field: "surname", headerName: "Nazwisko", width: 150 },
      { field: "email", headerName: "Email", flex: 1 },
      {
        field: "role",
        headerName: "Rola",
        width: 150,
        valueGetter: (value) => roleTranslations[value] || value,
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
    [handleEdit, handleDelete]
  );

  return (
    <Container maxWidth="lg" sx={{ p: "0 !important" }}>
      <AdminDataGrid
        columns={columns}
        rows={users}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onAddItem={handleAdd}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po imieniu, nazwisku, emailu...",
          addLabel: "Dodaj użytkownika",
        }}
      />
      <UserFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        user={currentUser}
      />
    </Container>
  );
};

export default UsersPage;
