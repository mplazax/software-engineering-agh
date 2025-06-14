// frontend/src/pages/ChangeRequestsPage.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import { pl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

const locales = { "pl": pl };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const ChangeRequestsPage = () => {
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [openChangeDialog, setopenChangeDialog] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    room_requirements: "",
    minimum_capacity: "",
  });

  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();
  const { user, loading } = useContext(UserContext);

  const fetchAllEvents = useCallback(async () => {
    try {
      const courses = await apiRequest("/courses");
      const allEvents = [];
      for (const course of courses) {
        const events = await apiRequest(`/courses/${course.id}/events`);
        for (const event of events) {
          const { start, end } = getSlotTimes(event.day, event.time_slot_id);
          allEvents.push({
            ...event,
            id: `${course.id}-${event.id}`,
            title: `Kurs ${course.name || course.id}`,
            start,
            end,
            time_slot_id: event.time_slot_id,
            courseId: course.id,
            courseName: course.name,
          });
        }
      }
      setEvents(allEvents);
    } catch (error) {
      console.error("Błąd podczas pobierania wydarzeń:", error);
    }
  }, []);

  // PROWADZĄCY
  const fetchTeacherGroupEvents = useCallback(async () => {
    try {
      const courses = await apiRequest("/courses");
      const myCourses = courses.filter(c => c.teacher_id === user.id);
      const allEvents = [];
      for (const course of myCourses) {
        const events = await apiRequest(`/courses/${course.id}/events`);
        for (const event of events) {
          const { start, end } = getSlotTimes(event.day, event.time_slot_id);
          allEvents.push({
            ...event,
            id: `${course.id}-${event.id}`,
            title: `Kurs ${course.name || course.id}`,
            start,
            end,
            time_slot_id: event.time_slot_id,
            courseId: course.id,
            courseName: course.name,
          });
        }
      }
      setEvents(allEvents);
    } catch (error) {
      console.error("Błąd podczas pobierania wydarzeń prowadzonych kursów:", error);
    }
  }, [user]);

  // STAROSTA
  const fetchStarostaGroupEvents = useCallback(async () => {
    try {
      const groups = await apiRequest("/groups?limit=1000");
      const myGroups = groups.filter(g => g.leader_id === user.id);
      const allEvents = [];
      for (const group of myGroups) {
        // Pobierz kurs powiązany z grupą
        const courses = await apiRequest("/courses");
        const groupCourses = courses.filter(c => c.group_id === group.id);
        for (const course of groupCourses) {
          const events = await apiRequest(`/courses/${course.id}/events`);
          for (const event of events) {
            const { start, end } = getSlotTimes(event.day, event.time_slot_id);
            allEvents.push({
              ...event,
              id: `${course.id}-${event.id}`,
              title: `Kurs ${course.name || course.id}`,
              start,
              end,
              time_slot_id: event.time_slot_id,
              courseId: course.id,
              courseName: course.name,
            });
          }
        }
      }
      setEvents(allEvents);
    } catch (error) {
      console.error("Błąd podczas pobierania wydarzeń grup starosty:", error);
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !loading) {
      navigate("/login", { replace: true });
    }
    if (!loading && user) {
      if (user.role === "ADMIN" || user.role === "KOORDYNATOR") {
        fetchAllEvents();
      } else if (user.role === "PROWADZACY") {
        fetchTeacherGroupEvents();
      } else if (user.role === "STAROSTA") {
        fetchStarostaGroupEvents();
      }
    }
  }, [user, loading, navigate, fetchAllEvents, fetchTeacherGroupEvents, fetchStarostaGroupEvents]);

  if (loading) {
    return;
  }

  // Funkcja pomocnicza do wyliczania godzin na podstawie slotu
  const getSlotTimes = (day, slot) => {
    const slotTimes = [
      { start: "08:00", end: "09:30" },
      { start: "09:45", end: "11:15" },
      { start: "11:30", end: "13:00" },
      { start: "13:15", end: "14:45" },
      { start: "15:00", end: "16:30" },
      { start: "16:45", end: "18:15" },
      { start: "18:30", end: "20:00" },
    ];
    const { start, end } = slotTimes[slot - 1];
    const startDate = new Date(`${day}T${start}`);
    const endDate = new Date(`${day}T${end}`);
    return { start: startDate, end: endDate };
  };

  // Po kliknięciu w wydarzenie pobierz szczegóły i pokaż dialog
  const handleSelectEvent = async (event) => {
    try {
      // Pobierz szczegóły pokoju
      let room = null;
      if (event.room_id) {
        room = await apiRequest(`/rooms/${event.room_id}`);
        console.log(room);
      }
      setEventDetails({
        ...event,
        room,
      });
      setOpenEventDialog(true);
    } catch (error) {
      console.error("Błąd podczas pobierania szczegółów wydarzenia:", error);
    }
  };

  const handleCloseEventDialog = () => {
    setOpenEventDialog(false);
    setEventDetails(null);
  };

  // Otwórz dialog do zgłoszenia zmiany
  const handleOpenChangeDialog = () => {
    setFormData({ reason: "", room_requirements: "" });
    setopenChangeDialog(true);
  };

  const handleCloseChangeDialog = () => setopenChangeDialog(false);

  const handleSubmitChange = async () => {
    try {
      if (!user) throw new Error("Brak danych użytkownika");

      const changeRequestPayload = {
        course_event_id: parseInt(eventDetails.id.split("-")[1], 10),
        initiator_id: user.id,
        status: "PENDING",
        reason: formData.reason,
        room_requirements: formData.room_requirements,
        minimum_capacity: parseInt(formData.minimum_capacity, 10),
        created_at: new Date().toISOString(),
      };


      await apiRequest("/change_requests/", {
        method: "POST",
        body: JSON.stringify(changeRequestPayload),
      });

      setopenChangeDialog(false);
      setOpenEventDialog(false);
      fetchAllEvents();
    } catch (error) {
      console.error("Błąd podczas zgłaszania zmiany:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNavigate = (action) => {
    let newDate = new Date(date);
    if (action === "TODAY") {
      newDate = new Date();
    } else if (action === "PREV") {
      if (view === Views.MONTH) {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (view === Views.WEEK) {
        newDate.setDate(newDate.getDate() - 7);
      } else if (view === Views.DAY) {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else if (action === "NEXT") {
      if (view === Views.MONTH) {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (view === Views.WEEK) {
        newDate.setDate(newDate.getDate() + 7);
      } else if (view === Views.DAY) {
        newDate.setDate(newDate.getDate() + 1);
      }
    } else if (action instanceof Date) {
      newDate = action;
    }
    setDate(newDate);
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4" gutterBottom>
          Twój plan zajęć
        </Typography>
        <Calendar
          localizer={localizer}
          culture="pl"
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700, margin: "50px 0" }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          onView={(newView) => setView(newView)}
          view={view}
          date={date}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          messages={{
            date: "Data",
            time: "Czas",
            event: "Wydarzenie",
            allDay: "Cały dzień",
            week: "Tydzień",
            work_week: "Tydzień roboczy",
            day: "Dzień",
            month: "Miesiąc",
            previous: "Poprzedni",
            next: "Następny",
            yesterday: "Wczoraj",
            tomorrow: "Jutro",
            today: "Dziś",
            agenda: "Agenda",
            noEventsInRange: "Brak wydarzeń w tym zakresie.",
          }}
        />
      </Box>

      {/* Dialog ze szczegółami wydarzenia */}
      <Dialog open={openEventDialog} onClose={handleCloseEventDialog}>
        <DialogTitle>Szczegóły wydarzenia</DialogTitle>
        <DialogContent>
          {eventDetails && (
            <List>
              <ListItem>
                <ListItemText primary="Kurs" secondary={eventDetails.courseName} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Data początkowa" secondary={eventDetails.start.toLocaleString()} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Data końcowa" secondary={eventDetails.end.toLocaleString()} />
              </ListItem>
              {eventDetails.room && (
                <>
                  <ListItem>
                    <ListItemText primary="Pokój" secondary={eventDetails.room.name} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Pojemność" secondary={eventDetails.room.capacity} />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                        primary="Wyposażenie"
                        secondary={
                          eventDetails.room.equipment.length > 0
                              ? eventDetails.room.equipment.map((e) => e.name).join(", ")
                              : "Brak danych"
                        }
                    />
                  </ListItem>

                </>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEventDialog}>Zamknij</Button>
          <Button onClick={handleOpenChangeDialog} variant="contained">
            Zgłoś potrzebę zmiany
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openChangeDialog} onClose={handleCloseChangeDialog}>
        <DialogTitle>Zgłoś potrzebę zmiany</DialogTitle>
        <DialogContent>
          <TextField
              margin="dense"
              label="Powód zmiany"
              name="reason"
              fullWidth
              value={formData.reason}
              onChange={handleChange}
          />
          <TextField
              margin="dense"
              label="Wymagania dotyczące sali"
              name="room_requirements"
              fullWidth
              value={formData.room_requirements}
              onChange={handleChange}
          />
          <TextField
              margin="dense"
              label="Minimalna pojemność sali"
              name="minimum_capacity"
              fullWidth
              type="number"
              value={formData.minimum_capacity}
              onChange={handleChange}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChangeDialog}>Anuluj</Button>
          <Button onClick={handleSubmitChange} variant="contained">
            Wyślij propozycję
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChangeRequestsPage;