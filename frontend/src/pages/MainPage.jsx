import React, { useContext, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Chip,
  Grid,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../contexts/AuthContext";
import { apiRequest } from "../api/apiService";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// Ikony dla panelu admina
import PeopleIcon from "@mui/icons-material/People";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import SchoolIcon from "@mui/icons-material/School";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

// Import komponentu StatCard
import StatCard from "../components/dashboard/StatCard.jsx";

// Definicje slotów czasowych (przeniesione z UserDashboard)
const timeSlotMap = {
  1: "08:00 - 09:30",
  2: "09:45 - 11:15",
  3: "11:30 - 13:00",
  4: "13:15 - 14:45",
  5: "15:00 - 16:30",
  6: "16:45 - 18:15",
  7: "18:30 - 20:00",
};

// ===================================================================
// Panel dla Administratora i Koordynatora
// ===================================================================

// ZMIANA: Usunięto hook `useAdminDashboardData` na rzecz prostszego `useQuery` tylko dla statystyk
const useAdminStats = () => {
  return useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => apiRequest("/dashboard/stats"),
  });
};

const AdminDashboard = ({ user }) => {
  const { data: stats, isLoading } = useAdminStats();

  const statCards = stats
    ? [
        {
          title: "Aktywnych użytkowników",
          value: stats.total_users,
          icon: <PeopleIcon />,
          color: "#3B82F6",
        },
        {
          title: "Zarejestrowanych sal",
          value: stats.total_rooms,
          icon: <MeetingRoomIcon />,
          color: "#10B981",
        },
        {
          title: "Zaplanowanych kursów",
          value: stats.total_courses,
          icon: <SchoolIcon />,
          color: "#F59E0B",
        },
        {
          title: "Zajęć dzisiaj",
          value: stats.events_today_count,
          icon: <EventAvailableIcon />,
          color: "#8B5CF6",
        },
        {
          title: "Zgłoszeń do akcji",
          value: stats.pending_requests_count,
          icon: <PendingActionsIcon />,
          color: "#EF4444",
        },
      ]
    : [];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel Administratora
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Przegląd kluczowych informacji o systemie, {user.name}.
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : (
        // ZMIANA: Uproszczony układ siatki
        <Grid container spacing={3}>
          {statCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.title}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
              />
            </Grid>
          ))}
          {/* Można tu w przyszłości dodać inne komponenty */}
        </Grid>
      )}
    </Box>
  );
};

// ===================================================================
// Panel dla Nauczyciela i Starosty (bez zmian)
// ===================================================================

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

const useUpcomingEvents = (user) => {
  return useQuery({
    queryKey: ["upcomingEvents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const allEvents = await apiRequest("/courses/events/all");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered = allEvents.filter((event) => {
        if (event.canceled) return false;
        const eventDate = new Date(event.day);
        if (eventDate < today) return false;

        if (user.role === "PROWADZACY") {
          return event.course.teacher_id === user.id;
        }
        if (user.role === "STAROSTA") {
          return event.course.group?.leader_id === user.id;
        }
        return false;
      });

      return filtered
        .map((e) => ({
          ...e,
          date: new Date(e.day),
          courseName: e.course.name,
        }))
        .sort((a, b) => a.date - b.date || a.time_slot_id - b.time_slot_id)
        .slice(0, 7);
    },
    enabled: !!user,
  });
};

const UserDashboard = ({ user }) => {
  const { data: upcomingEvents, isLoading: isLoadingEvents } =
    useUpcomingEvents(user);
  const roomsMap = useRoomsMap();

  return (
    <>
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
    </>
  );
};

// ===================================================================
// Główny komponent strony
// ===================================================================

const MainPage = () => {
  const { user } = useContext(AuthContext);

  const isAdminOrCoordinator =
    user?.role === "ADMIN" || user?.role === "KOORDYNATOR";

  return (
    <Container maxWidth="xl" sx={{ p: "0 !important" }}>
      {isAdminOrCoordinator ? (
        <AdminDashboard user={user} />
      ) : (
        <UserDashboard user={user} />
      )}
    </Container>
  );
};

export default MainPage;
