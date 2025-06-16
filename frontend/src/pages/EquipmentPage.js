import React, { useState, useMemo, useCallback } from "react";
import { Container, Stack, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BuildIcon from "@mui/icons-material/Build"; // Ikona dla wyposażenia

import { useCrud } from "../hooks/useCrud";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import EquipmentFormDialog from "../features/Admin/EquipmentFormDialog";

const EquipmentPage = () => {
  const {
    items: equipment,
    isLoading,
    isError,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud("equipment", "/equipment");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const handleAdd = () => {
    setCurrentItem(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((item) => {
    setCurrentItem(item);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (
        window.confirm("Czy na pewno chcesz usunąć ten element wyposażenia?")
      ) {
        try {
          await deleteItem(id);
        } catch (e) {
          alert(`Błąd: ${e.message}`);
        }
      }
    },
    [deleteItem]
  );

  const handleSave = async (data) => {
    try {
      if (currentItem) {
        await updateItem({ id: currentItem.id, updatedItem: data });
      } else {
        await createItem(data);
      }
      setDialogOpen(false);
    } catch (e) {
      // Błąd zostanie obsłużony w formularzu, ale logujemy go na wszelki wypadek
      console.error("Save failed:", e);
      throw e; // Rzucamy błąd dalej, aby formularz mógł go złapać
    }
  };

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      {
        field: "name",
        headerName: "Nazwa Wyposażenia",
        flex: 1,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <BuildIcon sx={{ mr: 1, color: "text.secondary" }} />
            {params.value}
          </Box>
        ),
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
        rows={equipment}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onAddItem={handleAdd}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po nazwie...",
          addLabel: "Dodaj wyposażenie",
        }}
      />
      <EquipmentFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        equipment={currentItem}
      />
    </Container>
  );
};

export default EquipmentPage;
