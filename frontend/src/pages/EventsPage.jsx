import React, { useState, useMemo, useCallback } from "react";
import {
  Container,
  Stack,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useQuery } from "@tanstack/react-query";

import { useCrud } from "../hooks/useCrud";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import EventFormDialog from "../features/Admin/EventFormDialog";
import { apiRequest } from "../api/apiService";

const timeSlotMap = {
  1: "08:00-09:30",
  2: "09:45-11:15",
  3: "11:30-13:00",
  4: "13:15-14:45",
  5: "15:00-16:30",
  6: "16:45-18:15",
  7: "18:30-20:00",
};

const filterEvents = (rows, searchText) => {
  return rows.filter((row) => {
    const courseName = row.course?.name || "";
    const roomName = row.room?.name || "";
    const day = row.day || "";
    return (
      courseName.toLowerCase().includes(searchText) ||
      roomName.toLowerCase().includes(searchText) ||
      day.toLowerCase().includes(searchText)
    );
  });
};

const EventsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    data: events,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["allEvents"],
    queryFn: () => apiRequest("/courses/events/all"),
  });

  const {
    createItem,
    updateItem,
    deleteItem,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCrud("allEvents", "/courses/events", {
    runQuery: false,
    queryEndpoint: "/courses/events/all", // Endpoint dla odświeżania listy
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const handleAdd = () => {
    setCurrentEvent(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((event) => {
    setCurrentEvent(event);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (eventId) => {
      if (
        window.confirm(
          "Czy na pewno chcesz usunąć to wydarzenie? Tej operacji nie można cofnąć."
        )
      ) {
        await deleteItem(eventId);
      }
    },
    [deleteItem]
  );

  const handleSave = async (formData) => {
    try {
      if (currentEvent) {
        await updateItem({ id: currentEvent.id, updatedItem: formData });
      } else {
        await createItem(formData);
      }
    } catch(e) {
      console.error("Save operation failed in component", e);
      throw e;
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "course",
        headerName: "Kurs",
        flex: 1,
        minWidth: 180,
        valueGetter: ({ row }) => row?.course?.name ?? "",
        renderCell: ({ row }) => row?.course?.name ?? "Brak kursu",
      },
      {
        field: "room",
        headerName: "Sala",
        width: 130,
        valueGetter: ({ row }) => row?.room?.name ?? "",
        renderCell: ({ row }) => row?.room?.name ?? "Brak sali",
      },
      { field: "day", headerName: "Data", width: 110 },
      {
        field: "time_slot_id",
        headerName: "Godziny",
        width: 120,
        renderCell: ({ value }) => timeSlotMap[value] || "Nieznany slot",
      },
      {
        field: "canceled",
        headerName: "Status",
        width: 110,
        renderCell: ({ value }) => (
          <Chip
            label={value ? "Anulowane" : "Aktywne"}
            color={value ? "error" : "success"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "actions",
        headerName: "Akcje",
        width: 100,
        sortable: false,
        filterable: false,
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
    ];

    if (isMobile) {
      return baseColumns;
    }

    // Dodaj kolumny dla większych ekranów
    return [{ field: "id", headerName: "ID", width: 70 }, ...baseColumns];
  }, [isMobile, handleEdit, handleDelete]);

  const anyMutationLoading = isCreating || isUpdating || isDeleting;

  return (
    <Container maxWidth="xl" sx={{ p: "0 !important" }}>
      <AdminDataGrid
        columns={columns}
        rows={events || []}
        isLoading={isLoading || anyMutationLoading}
        isError={isError}
        error={error}
        onAddItem={handleAdd}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po kursie, dacie, sali...",
          addLabel: "Dodaj wydarzenie",
        }}
        customFilterFn={filterEvents}
      />
      <EventFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        event={currentEvent}
      />
    </Container>
  );
};

export default EventsPage;
