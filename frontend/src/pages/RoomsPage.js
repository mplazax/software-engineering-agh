import React, { useState, useMemo, useCallback } from "react";
import { Container, Stack, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";

import { useCrud } from "../hooks/useCrud";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import RoomFormDialog from "../features/Admin/RoomFormDialog";

const roomTypeTranslations = {
  LECTURE_HALL: "Sala wykładowa",
  LABORATORY: "Laboratorium",
  SEMINAR_ROOM: "Sala seminaryjna",
  CONFERENCE_ROOM: "Sala konferencyjna",
  OTHER: "Inne",
};

// Niestandardowa funkcja filtrowania przekazywana jako prop
const filterRooms = (rows, searchText) => {
  return rows.filter((row) => {
    const inName = row.name.toLowerCase().includes(searchText);
    const inType = roomTypeTranslations[row.type]
      .toLowerCase()
      .includes(searchText);
    const inCapacity = String(row.capacity).includes(searchText);
    const inEquipment = row.equipment.some((eq) =>
      eq.name.toLowerCase().includes(searchText)
    );
    return inName || inType || inCapacity || inEquipment;
  });
};

const RoomsPage = () => {
  const {
    items: rooms,
    isLoading,
    isError,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud("rooms", "/rooms");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  const handleAdd = () => {
    setCurrentRoom(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((room) => {
    setCurrentRoom(room);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Czy na pewno chcesz usunąć tę salę?")) {
        try {
          await deleteItem(id);
        } catch (e) {
          alert(`Błąd: ${e.message}`);
        }
      }
    },
    [deleteItem]
  );

  const handleSave = async (roomData) => {
    try {
      if (currentRoom) {
        await updateItem({ id: currentRoom.id, updatedItem: roomData });
      } else {
        await createItem(roomData);
      }
      setDialogOpen(false);
      return Promise.resolve();
    } catch (e) {
      console.error("Save failed", e);
      return Promise.reject(e);
    }
  };

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      {
        field: "name",
        headerName: "Nazwa Sali",
        width: 200,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <MeetingRoomIcon sx={{ mr: 1, color: "text.secondary" }} />
            {params.value}
          </Box>
        ),
      },
      {
        field: "type",
        headerName: "Typ",
        width: 180,
        valueGetter: (value) => roomTypeTranslations[value] || value,
      },
      {
        field: "capacity",
        headerName: "Pojemność",
        type: "number",
        width: 120,
      },
      {
        field: "equipment",
        headerName: "Wyposażenie",
        flex: 1,
        valueGetter: (value) => value.map((eq) => eq.name).join(", "),
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
        rows={rooms}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onAddItem={handleAdd}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po nazwie lub wyposażeniu...",
          addLabel: "Dodaj Salę",
        }}
        customFilterFn={filterRooms} // Przekazujemy naszą niestandardową logikę
      />
      <RoomFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        room={currentRoom}
      />
    </Container>
  );
};

export default RoomsPage;
