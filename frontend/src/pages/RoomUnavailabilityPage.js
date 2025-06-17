import React, { useState, useMemo, useCallback } from "react";
import { Container, Stack, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import { useQuery } from "@tanstack/react-query";
import { useCrud } from "../hooks/useCrud";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import RoomUnavailabilityFormDialog from "../features/Admin/RoomUnavailabilityFormDialog";
import { apiRequest } from "../api/apiService";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const useRoomsMap = () => {
  const { data = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiRequest("/rooms/"),
  });
  return useMemo(
    () => new Map(data.map((item) => [item.id, item.name])),
    [data]
  );
};

const RoomUnavailabilityPage = () => {
  const {
    items: unavailabilities,
    isLoading,
    isError,
    error,
    createItem,
    deleteItem,
  } = useCrud("room-unavailability", "/room-unavailability");

  const roomsMap = useRoomsMap();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const handleAdd = () => {
    setCurrentItem(null);
    setDialogOpen(true);
  };

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Czy na pewno chcesz usunąć tę blokadę?")) {
        await deleteItem(id).catch((e) => alert(`Błąd: ${e.message}`));
      }
    },
    [deleteItem]
  );

  const handleSave = async (data) => {
    // Obecnie nie ma edycji, więc tylko tworzymy nowe blokady
    await createItem(data);
  };

  const columns = useMemo(
    () => [
      {
        field: "room_id",
        headerName: "Sala",
        flex: 1,
        valueGetter: (value) => roomsMap.get(value) || "Nieznana sala",
      },
      {
        field: "start_datetime",
        headerName: "Początek blokady",
        flex: 1,
        renderCell: (params) =>
          format(new Date(params.value), "dd.MM.yyyy HH:mm", { locale: pl }),
      },
      {
        field: "end_datetime",
        headerName: "Koniec blokady",
        flex: 1,
        renderCell: (params) =>
          format(new Date(params.value), "dd.MM.yyyy HH:mm", { locale: pl }),
      },
      {
        field: "reason",
        headerName: "Powód",
        flex: 2,
      },
      {
        field: "actions",
        headerName: "Akcje",
        width: 100,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
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
    [roomsMap, handleDelete]
  );

  return (
    <Container maxWidth="lg" sx={{ p: "0 !important" }}>
      <AdminDataGrid
        columns={columns}
        rows={unavailabilities}
        isLoading={isLoading || roomsMap.size === 0}
        isError={isError}
        error={error}
        onAddItem={handleAdd}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po nazwie sali lub powodzie...",
          addLabel: "Dodaj blokadę",
        }}
      />
      <RoomUnavailabilityFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        unavailability={currentItem}
      />
    </Container>
  );
};

export default RoomUnavailabilityPage;
