import React, { useState, useMemo, useCallback } from "react";
import { Container, Stack, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import AdminDataGrid from "../features/Admin/AdminDataGrid";
import EventFormDialog from "../features/Admin/EventFormDialog";
import { useCrud } from "../hooks/useCrud"; // Twój gotowy useCrud
import { apiRequest } from "../api/apiService";

const EventsPage = () => {
    const queryClient = useQueryClient();

    // Funkcja pobierająca wszystkie eventy z kursów (odpowiednik useAllEvents)
    const fetchAllEvents = async () => {
        const courses = await apiRequest("/courses");

        const eventPromises = courses.map((course) =>
            apiRequest(`/courses/${course.id}/events`).then((events) =>
                events.map((event) => ({
                    ...event,
                    courseName: course.name,
                    courseId: course.id,
                }))
            )
        );

        const eventsByCourse = await Promise.all(eventPromises);
        return eventsByCourse.flat();
    };

    // Query do pobrania wszystkich eventów
    const {
        data: events,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["allEvents"],
        queryFn: fetchAllEvents,
    });

    // useCrud dla mutacji, z endpointem "/courses/events"
    const {
        createItem,
        updateItem,
        deleteItem,
        isCreating,
        isUpdating,
        isDeleting,
    } = useCrud("events", "/courses/events");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);

    // Otwarcie formularza do dodania nowego eventu
    const handleAdd = () => {
        setInitialData(null);
        setDialogOpen(true);
    };

    // Usuwanie eventu - wywołujemy deleteItem z useCrud
    const handleDelete = useCallback(
        async (eventId) => {
            if (window.confirm("Czy na pewno chcesz usunąć to wydarzenie?")) {
                try {
                    await deleteItem(eventId);
                    // Odświeżamy listę eventów po usunięciu
                    queryClient.invalidateQueries(["allEvents"]);
                } catch (e) {
                    alert("Błąd podczas usuwania: " + e.message);
                }
            }
        },
        [deleteItem, queryClient]
    );

    // Zapis (dodanie nowego eventu), wspiera repeatWeekly
    const handleSave = async (formData, repeatWeekly) => {
        try {
            const today = new Date();
            const endDate = new Date(today.getFullYear(), 6, 1); // do 1 lipca
            const requests = [];

            const base = {
                course_id: parseInt(formData.course_id),
                room_id: parseInt(formData.room_id),
                time_slot_id: parseInt(formData.time_slot_id),
                canceled: false,
            };

            if (repeatWeekly) {
                let date = new Date(formData.day);
                while (date <= endDate) {
                    const payload = { ...base, day: date.toISOString().split("T")[0] };
                    requests.push(createItem(payload));
                    date.setDate(date.getDate() + 7);
                }
                await Promise.all(requests);
            } else {
                const payload = {
                    ...base,
                    day: formData.day,
                };
                await createItem(payload);
            }

            // Odświeżamy eventy po zapisie
            queryClient.invalidateQueries(["allEvents"]);
            setDialogOpen(false);
        } catch (e) {
            console.error(e);
            alert("Błąd podczas zapisu: " + e.message);
        }
    };

    const columns = useMemo(
        () => [
            { field: "id", headerName: "ID", width: 70 },
            { field: "courseId", headerName: "Kurs ID", width: 100 },
            { field: "courseName", headerName: "Kurs", flex: 1 },
            { field: "room_id", headerName: "Sala ID", width: 100 },
            { field: "day", headerName: "Dzień", width: 120 },
            { field: "time_slot_id", headerName: "Slot", width: 100 },
            {
                field: "canceled",
                headerName: "Anulowane",
                width: 100,
                valueGetter: ({ row }) => (row?.canceled ? "Tak" : "Nie"),
            },
            {
                field: "actions",
                headerName: "Akcje",
                width: 120,
                sortable: false,
                renderCell: (params) => (
                    <Stack direction="row" spacing={1}>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(params.row.id)}
                            disabled={isDeleting}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Stack>
                ),
            },
        ],
        [handleDelete, isDeleting]
    );

    return (
        <Container maxWidth="lg" sx={{ p: "0 !important" }}>
            <AdminDataGrid
                columns={columns}
                rows={events || []}
                isLoading={isLoading || isCreating || isUpdating || isDeleting}
                isError={isError}
                error={error}
                onAddItem={handleAdd}
                toolbarConfig={{
                    searchPlaceholder: "Szukaj po kursie, dacie, sali...",
                    addLabel: "Dodaj wydarzenie",
                }}
            />
            <EventFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
                initialData={initialData}
            />
        </Container>
    );
};

export default EventsPage;
