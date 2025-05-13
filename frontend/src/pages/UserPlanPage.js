import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { apiRequest } from "../services/apiService";
import Navbar from "../components/Navbar";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const UserPlanPage = () => {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", start: "", end: "" });

  useEffect(() => {
    apiRequest("/courses/events")
      .then((data) => setEvents(data.map(event => ({
        id: event.id,
        title: event.name,
        start: new Date(event.start_datetime),
        end: new Date(event.end_datetime),
      }))))
      .catch((error) => console.error("Error fetching events:", error));
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const payload = {
      name: formData.title,
      start_datetime: new Date(formData.start).toISOString(),
      end_datetime: new Date(formData.end).toISOString(),
    };

    apiRequest("/courses/events", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((newEvent) => {
        setEvents((prev) => [
          ...prev,
          {
            id: newEvent.id,
            title: newEvent.name,
            start: new Date(newEvent.start_datetime),
            end: new Date(newEvent.end_datetime),
          },
        ]);
        handleClose();
      })
      .catch((error) => console.error("Error adding event:", error));
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Twój plan</Typography>
        <Button variant="contained" onClick={handleOpen}>
          Dodaj wydarzenie
        </Button>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500, margin: "50px 0" }}
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj wydarzenie</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Tytuł"
            name="title"
            fullWidth
            value={formData.title}
            onChange={handleChange}
          />
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
          <Button onClick={handleClose}>Anuluj</Button>
          <Button onClick={handleSubmit} variant="contained">
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserPlanPage;