// frontend/src/pages/ChangeRequestsPage.js
import React, { useState, useEffect, useContext } from "react";
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
  const [openProposalDialog, setOpenProposalDialog] = useState(false);
  const [formData, setFormData] = useState({ start: "", end: "", reason: "", room_requirements: "" });
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();
  const user = useContext(UserContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
    fetchAllEvents();
  }, [navigate]);

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

  const fetchAllEvents = async () => {
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
  };

  // Po kliknięciu w wydarzenie pobierz szczegóły i pokaż dialog
  const handleSelectEvent = async (event) => {
    try {
      // Pobierz szczegóły pokoju
      let room = null;
      if (event.room_id) {
        room = await apiRequest(`/rooms/${event.room_id}`);
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
  const handleOpenProposalDialog = () => {
    setFormData({ start: "", end: "", reason: "", room_requirements: "" });
    setOpenProposalDialog(true);
  };

  const handleCloseProposalDialog = () => setOpenProposalDialog(false);

  const handleSubmitProposal = async () => {
    try {
      if (!user) throw new Error("Brak danych użytkownika");

      const changeRequestPayload = {
        course_event_id: parseInt(eventDetails.id.split("-")[1], 10),
        initiator_id: user.id,
        status: "PENDING",
        reason: formData.reason,
        room_requirements: formData.room_requirements,
        created_at: new Date().toISOString(),
      };
      alert(changeRequestPayload);
      const newChangeRequest = await apiRequest("/change_requests/", {
        method: "POST",
        body: JSON.stringify(changeRequestPayload),
      });

      const proposalPayload = {
        change_request_id: newChangeRequest.id,
        user_id: user.id,
        interval: {
          start_date: new Date(formData.start).toISOString(),
          end_date: new Date(formData.end).toISOString(),
        },
      };
      await apiRequest("/proposals/", {
        method: "POST",
        body: JSON.stringify(proposalPayload),
      });

      setOpenProposalDialog(false);
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
          Zarządzaj zgłoszeniami zmian
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
            showMore: (total) => `+${total} więcej`,
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
                    <ListItemText primary="Wyposażenie" secondary={eventDetails.room.equipment || "Brak danych"} />
                  </ListItem>
                </>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEventDialog}>Zamknij</Button>
          <Button onClick={handleOpenProposalDialog} variant="contained">
            Zaproponuj zmianę
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openProposalDialog} onClose={handleCloseProposalDialog}>
        <DialogTitle>Zaproponuj zmianę terminu</DialogTitle>
        <DialogContent>
          <TextField
              margin="dense"
              label="Nowa data początkowa"
              name="start"
              type="datetime-local"
              fullWidth
              value={formData.start}
              InputLabelProps={{ shrink: true }}
              onChange={handleChange}
          />
          <TextField
              margin="dense"
              label="Nowa data końcowa"
              name="end"
              type="datetime-local"
              fullWidth
              value={formData.end}
              InputLabelProps={{ shrink: true }}
              onChange={handleChange}
          />
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProposalDialog}>Anuluj</Button>
          <Button onClick={handleSubmitProposal} variant="contained">
            Wyślij propozycję
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChangeRequestsPage;