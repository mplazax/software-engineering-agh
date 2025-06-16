import React, { useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../contexts/AuthContext";
import { apiRequest } from "../api/apiService";
import { format } from "date-fns";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";

const timeSlotMap = {
  1: "08:00 - 09:30",
  2: "09:45 - 11:15",
  3: "11:30 - 13:00",
  4: "13:15 - 14:45",
  5: "15:00 - 16:30",
  6: "16:45 - 18:15",
  7: "18:30 - 20:00",
};

const useUpcomingEvents = (user) => {
  return useQuery({
    queryKey: ["upcomingEvents", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const courses = await apiRequest("/courses");
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

      return allEvents
        .map((e) => ({ ...e, date: new Date(e.day) }))
        .filter((e) => e.date >= new Date() && !e.canceled)
        .sort((a, b) => a.date - b.date)
        .slice(0, 5);
    },
    enabled: !!user,
  });
};

const RecentActivity = () => {
  const activities = [
    {
      icon: <CheckCircleOutlineIcon color="success" />,
      text: "Reservation Confirmed",
      subject: "Room 201",
    },
    {
      icon: <EditIcon color="secondary" />,
      text: "Reservation Updated",
      subject: "Room 305",
    },
    {
      icon: <HourglassTopIcon color="warning" />,
      text: "Reservation Requested",
      subject: "Room 102",
    },
  ];

  return (
    <Paper sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      <List>
        {activities.map((activity, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: "background.default" }}>
                {activity.icon}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={activity.text}
              secondary={activity.subject}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

const MainPage = () => {
  const { user } = useContext(AuthContext);
  const { data: upcomingEvents = [], isLoading: isLoadingEvents } =
    useUpcomingEvents(user);

  return (
    <Container maxWidth="lg" sx={{ p: "0 !important" }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Reservations
        </Typography>
        {isLoadingEvents ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : upcomingEvents.length > 0 ? (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Room", "Date", "Time", "Course", "Status"].map((head) => (
                    <th
                      key={head}
                      style={{
                        padding: "12px",
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
                        padding: "12px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      {event.room_id || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      {format(event.date, "MMM dd, yyyy")}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: "1.5px solid #F1F5F9",
                      }}
                    >
                      {timeSlotMap[event.time_slot_id] || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      {event.courseName || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Chip
                        label="Confirmed"
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
          <Typography sx={{ p: 2, textAlign: "center" }} color="text.secondary">
            No upcoming reservations.
          </Typography>
        )}
      </Paper>

      <RecentActivity />
    </Container>
  );
};

export default MainPage;
