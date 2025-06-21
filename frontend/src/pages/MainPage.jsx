import React, { useContext, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Chip,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../contexts/AuthContext";
import { apiRequest } from "../api/apiService";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import PeopleIcon from "@mui/icons-material/People";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

// --- Admin-specific Dashboard ---

const StatCard = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2, display: "flex", alignItems: "center", height: "100%" }}>
    <Avatar sx={{ bgcolor: color, mr: 2 }}>{icon}</Avatar>
    <Box>
      <Typography variant="h6" component="div">
        {value}
      </Typography>
      <Typography color="text.secondary">{title}</Typography>
    </Box>
  </Paper>
);

const AdminDashboard = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => apiRequest("/dashboard/stats"),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">Błąd ładowania danych: {error.message}</Alert>
    );
  }

  const { stats, recent_pending_requests } = data;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" component="h1" gutterBottom>
          Panel Administratora
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Przegląd kluczowych informacji o systemie.
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Użytkownicy"
          value={stats.total_users}
          icon={<PeopleIcon />}
          color="primary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Sale"
          value={stats.total_rooms}
          icon={<MeetingRoomIcon />}
          color="success.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Aktywne Zajęcia"
          value={stats.active_events_count}
          icon={<EventAvailableIcon />}
          color="info.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Oczekujące Zgłoszenia"
          value={stats.pending_change_requests}
          icon={<HourglassEmptyIcon />}
          color="warning.main"
        />
      </Grid>

      <Grid item xs={12} md={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ostatnie oczekujące zgłoszenia
          </Typography>
          {recent_pending_requests.length > 0 ? (
            <List disablePadding>
              {recent_pending_requests.map((req, index) => (
                <React.Fragment key={req.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${req.course_event.course.name}`}
                      secondary={`Zgłaszający: ${req.initiator.name} ${
                        req.initiator.surname
                      } | Data: ${format(
                        new Date(req.created_at),
                        "dd.MM.yyyy HH:mm",
                        { locale: pl }
                      )}`}
                    />
                  </ListItem>
                  {index < recent_pending_requests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography
              color="text.secondary"
              sx={{ p: 2, textAlign: "center" }}
            >
              Brak oczekujących zgłoszeń.
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

// --- User-specific dashboard (Prowadzący/Starosta) ---

const timeSlotMap = {
  1: "08:00 - 09:30",
  2: "09:45 - 11:15",
  3: "11:30 - 13:00",
  4: "13:15 - 14:45",
  5: "15:00 - 16:30",
  6: "16:45 - 18:15",
  7: "18:30 - 20:00",
};

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
        myCourses = courses;
      }

      const eventPromises = myCourses.map(async (course) => {
        const events = await apiRequest(`/courses/${course.id}/events`);
        return events.map((e) => ({ ...e, courseName: course.name }));
      });

      const eventsByCourse = await Promise.all(eventPromises);
      const allEvents = eventsByCourse.flat();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return allEvents
        .map((e) => ({ ...e, date: new Date(e.day) }))
        .filter((e) => !e.canceled && e.date >= today)
        .sort((a, b) => a.date - b.date)
        .slice(0, 7);
    },
    enabled: !!user,
  });
};

const UserDashboard = () => {
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

// --- Main component with role-based rendering ---

const MainPage = () => {
  const { user } = useContext(AuthContext);

  if (user.role === "ADMIN" || user.role === "KOORDYNATOR") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
};

export default MainPage;
