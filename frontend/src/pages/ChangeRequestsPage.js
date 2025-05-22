import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import { pl } from "date-fns/locale"; // Dodaj ten import

const locales = { "pl": pl }; // Ustaw polski locale
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // tydzień od poniedziałku
  getDay,
  locales,
});

const ChangeRequestsPage = () => {
  const [events, setEvents] = useState([]);
  const [openProposal, setOpenProposal] = useState(false);
  const [formData, setFormData] = useState({ start: "", end: "" });
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date()); // Dodaj stan daty

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      // Pobierz wszystkie kursy
      const courses = await apiRequest("/courses");
      // Pobierz wydarzenia dla każdego kursu
      const allEvents = [];
      for (const course of courses) {
        const events = await apiRequest(`/courses/${course.id}/events`);
        allEvents.push(
          ...events.map((event) => ({
            id: `${course.id}-${event.id}`,
            title: `Kurs ${course.name || course.id}`,
            start: new Date(event.start_datetime),
            end: new Date(event.end_datetime),
          }))
        );
      }
      setEvents(allEvents);
    } catch (error) {
      console.error("Błąd podczas pobierania wydarzeń:", error);
    }
  };

  const handleOpenProposal = () => {
    setFormData({ start: "", end: "" });
    setOpenProposal(true);
  };

  const handleCloseProposal = () => setOpenProposal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitProposal = () => {
    const payload = {
      change_request_id: 1, // Przykładowe ID zgłoszenia zmiany
      user_id: 1, // Przykładowe ID użytkownika
      interval: {
        start_date: new Date(formData.start).toISOString(),
        end_date: new Date(formData.end).toISOString(),
      },
    };

    apiRequest("/proposals", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then(() => {
        fetchAllEvents();
        handleCloseProposal();
      })
      .catch((error) => console.error("Błąd podczas dodawania propozycji:", error));
  };

  // Funkcje do obsługi nawigacji
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
        <Button variant="contained" onClick={handleOpenProposal} sx={{ marginBottom: 2 }}>
          Dodaj propozycję zmiany
        </Button>
        <Calendar
          localizer={localizer}
          culture="pl" // <-- dodaj to!
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700, margin: "50px 0" }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          onView={(newView) => setView(newView)}
          view={view}
          date={date}
          onNavigate={handleNavigate}
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

      <Dialog open={openProposal} onClose={handleCloseProposal}>
        <DialogTitle>Dodaj propozycję zmiany</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Data początkowa"
            name="start"
            type="datetime-local"
            fullWidth
            value={formData.start}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Data końcowa"
            name="end"
            type="datetime-local"
            fullWidth
            value={formData.end}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProposal}>Anuluj</Button>
          <Button onClick={handleSubmitProposal} variant="contained">
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChangeRequestsPage;