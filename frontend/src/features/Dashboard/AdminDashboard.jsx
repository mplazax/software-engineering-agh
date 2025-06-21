import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  ListItemIcon,
  Avatar,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PeopleIcon from "@mui/icons-material/People";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { apiRequest } from "../../api/apiService";

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
  const navigate = useNavigate();
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
      {/* Stat Cards */}
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

      {/* Recent Pending Requests */}
      <Grid item xs={12} md={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ostatnie oczekujące zgłoszenia
          </Typography>
          {recent_pending_requests.length > 0 ? (
            <List disablePadding>
              {recent_pending_requests.map((req, index) => (
                <React.Fragment key={req.id}>
                  <ListItem
                    secondaryAction={
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          navigate(`/recommendations?requestId=${req.id}`)
                        }
                      >
                        Przejdź
                      </Button>
                    }
                  >
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

export default AdminDashboard;
