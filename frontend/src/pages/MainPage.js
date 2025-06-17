import React, { useContext, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../contexts/AuthContext";
import { apiRequest } from "../api/apiService";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// Definicje slotów czasowych
const timeSlotMap = {
  1: "08:00 - 09:30",
  2: "09:45 - 11:15",
  3: "11:30 - 13:00",
  4: "13:15 - 14:45",
  5: "15:00 - 16:30",
  6: "16:45 - 18:15",
  7: "18:30 - 20:00",
};

// Hook do pobierania mapy ID sal na ich nazwy
const useRoomsMap = () => {
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiRequest("/rooms/"),
  });
  return useMemo(
    () => new Map(rooms.map((room) => [room.id, room.name])),
    [rooms]
  );
};

// Główny hook do pobierania nadchodzących wydarzeń
const useUpcomingEvents = (user) => {
  return useQuery({
    queryKey: ["upcomingEvents", user?.id],
    queryFn: async () => {
      if (!user) return [];

      let courses = await apiRequest("/courses");
      let myCourses = [];

      if (user.role === "PROWADZACY") {
        myCourses = courses.filter((c) => c.teacher_id === user.id);
      } else if (user.role === "STAROSTA") {
        const groups = await apiRequest("/groups");
        const myGroupId = groups.find((g) => g.leader_id === user.id)?.id;
        if (myGroupId) {
          myCourses = courses.filter((c) => c.group_id === myGroupId);
        }
      } else {
        myCourses = courses; // Admin/Koordynator widzi wszystko
      }

      const eventPromises = myCourses.map(async (course) => {
        const events = await apiRequest(`/courses/${course.id}/events`);
        return events.map((e) => ({ ...e, courseName: course.name }));
      });

      const eventsByCourse = await Promise.all(eventPromises);
      const allEvents = eventsByCourse.flat();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ustaw godzinę na początek dnia do porównań

      return allEvents
        .map((e) => ({ ...e, date: new Date(e.day) }))
        .filter((e) => !e.canceled && e.date >= today) // Pokaż tylko aktywne wydarzenia od dzisiaj
        .sort((a, b) => a.date - b.date) // Sortuj od najbliższego
        .slice(0, 7); // Pokaż do 7 nadchodzących wydarzeń
    },
    enabled: !!user,
  });
};

const MainPage = () => {
  const { user } = useContext(AuthContext);
  const { data: upcomingEvents = [], isLoading: isLoadingEvents } =
    useUpcomingEvents(user);
  const roomsMap = useRoomsMap();

  return (
    <Container maxWidth="lg" sx={{ p: "0 !important" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Witaj ponownie, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Oto przegląd Twoich nadchodzących rezerwacji i wydarzeń.
      </Typography>

      <Paper sx={{ p: 2, overflow: "hidden" }}>
        <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
          Twoje nadchodzące zajęcia
        </Typography>
        {isLoadingEvents ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : upcomingEvents.length > 0 ? (
          <Box sx={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "600px",
              }}
            >
              <thead>
                <tr>
                  {["Kurs", "Data", "Godziny", "Sala", "Status"].map((head) => (
                    <th
                      key={head}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.map((event) => (
                  <tr key={event.id}>
                    <td
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Typography variant="body2" fontWeight="500">
                        {event.courseName || "Brak nazwy"}
                      </Typography>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Typography variant="body2">
                        {format(event.date, "EEEE, dd.MM.yyyy", { locale: pl })}
                      </Typography>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Typography variant="body2">
                        {timeSlotMap[event.time_slot_id] || "Brak danych"}
                      </Typography>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Typography variant="body2">
                        {roomsMap.get(event.room_id) || "Brak sali"}
                      </Typography>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Chip
                        label="Potwierdzone"
                        color="success"
                        size="small"
                        sx={{
                          bgcolor: "success.light",
                          color: "success.dark",
                          fontWeight: 600,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        ) : (
          <Typography sx={{ p: 4, textAlign: "center" }} color="text.secondary">
            Brak nadchodzących rezerwacji.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default MainPage;
