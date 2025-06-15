import React, { useEffect, useState } from "react";
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Card, CardContent, CardActionArea, Snackbar, Alert } from "@mui/material";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import { useNavigate } from "react-router-dom";

const ProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ change_request_id: "", user_id: "", day: "", time_slot_id: "" });
  const [userDetails, setUserDetails] = useState({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [courseNames, setCourseNames] = useState({});
  const [availableChangeRequests] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
    const userId = localStorage.getItem("user_id");
    setCurrentUserId(userId || "");

    // Zamiast proposals pobieraj change_requests/related
    apiRequest("/change_requests/related")
      .then(async (data) => {
        setProposals(data); // Możesz zmienić nazwę setProposals na setChangeRequests jeśli chcesz

        // Pobierz dane użytkowników tylko dla unikalnych user_id z change_requests
        const uniqueUserIds = [...new Set(data.map((cr) => cr.user_id))];
        const userMap = {};
        await Promise.all(
          uniqueUserIds.map(async (id) => {
            if (id) {
              try {
                const user = await apiRequest(`/users/${id}`);
                userMap[id] = user;
              } catch (e) {
                userMap[id] = { name: "Nieznany", email: "" };
              }
            }
          })
        );
        setUserDetails(userMap);

        // Pobierz nazwy kursów dla każdego change_requesta
        const courseNameMap = {};
        await Promise.all(
          data.map(async (cr) => {
            try {
              const courseEventId = cr.course_event_id;
              if (!courseEventId) return;
              const courseEvent = await apiRequest(`/courses/${courseEventId}/events`);
              const courseId = courseEvent[0].course_id;
              if (!courseId) return;
              const course = await apiRequest(`/courses/${courseId}`);
              courseNameMap[cr.id] = course.name || "Nieznany kurs";
            } catch {
              courseNameMap[cr.id] = "Nieznany kurs";
            }
          })
        );
        setCourseNames(courseNameMap);
      })
      .catch((error) => console.error("Error fetching change requests:", error));
  }, [navigate]);

  const handleOpen = async () => {
    // Pobierz user_id z /auth/me
    try {
      const user = await apiRequest("/auth/me");
      setFormData((prev) => ({
        ...prev,
        user_id: user.id || "",
      }));
    } catch {
      setFormData((prev) => ({
        ...prev,
        user_id: "",
      }));
    }
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    apiRequest("/proposals", {
      method: "POST",
      body: JSON.stringify({
      change_request_id: formData.change_request_id,
      user_id: formData.user_id,
      day: formData.day,
      time_slot_id: Number(formData.time_slot_id),
}),
    })
      .then((newProposal) => {
        setProposals((prev) => [...prev, newProposal]);
        handleClose();
        // Opcjonalnie pobierz dane użytkownika dla nowej propozycji
        if (newProposal.user_id && !userDetails[newProposal.user_id]) {
          apiRequest(`/users/${newProposal.user_id}`)
            .then((user) => setUserDetails((prev) => ({ ...prev, [newProposal.user_id]: user })))
            .catch(() => {});
        }
      })
      .catch((error) => console.error("Error adding proposal:", error));
  };

  // Funkcja do obsługi kliknięcia na change request
  const handleCardClick = () => {
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Change Requests</Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {proposals.map((cr) => {
            const user = userDetails[cr.initiator_id];
            const courseName = courseNames[cr.id];

            const formatDateTime = (dateStr) => {
              if (!dateStr) return "";
              const d = new Date(dateStr);
              return d.toLocaleString();
            };

            return (
              <Card
                key={cr.id}
                sx={{ width: 340, minHeight: 220, display: "flex", flexDirection: "column" }}
                variant="outlined"
              >
                <CardActionArea onClick={handleCardClick}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Change Request ID: {cr.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {cr.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Kurs (course_event_id): {cr.course_event_id} {courseName ? `(${courseName})` : ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inicjator (initiator_id): {cr.initiator_id} {user ? `(${user.name} - ${user.email})` : ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Powód: {cr.reason}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Wymagania sali: {cr.room_requirements}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minimalna pojemność: {cr.minimum_capacity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Utworzono: {formatDateTime(cr.created_at)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: "100%" }}>
            WIP
          </Alert>
        </Snackbar>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj propozycję</DialogTitle>
        <DialogContent>
          {/* ZAMIANA: Select z listą change requestów */}
          <TextField
            margin="dense"
            label="Change request (dzień, slot)"
            name="change_request_id"
            select
            fullWidth
            value={formData.change_request_id}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          >
            {availableChangeRequests.length === 0 && (
              <MenuItem value="">Brak dostępnych change requestów</MenuItem>
            )}
            {availableChangeRequests.map((cr) => (
              <MenuItem key={cr.id} value={cr.id}>
                {`ID: ${cr.id} | Dzień: ${cr.day || "?"} | Slot: ${cr.time_slot_id || "?"}`}
              </MenuItem>
            ))}
          </TextField>
          {/* Pole wyboru dnia */}
          <TextField
            margin="dense"
            name="day"
            label="Dzień"
            type="date"
            fullWidth
            value={formData.day || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          {/* Pole wyboru slotu czasowego */}
          <TextField
            margin="dense"
            name="time_slot_id"
            label="Slot czasowy"
            select
            fullWidth
            value={formData.time_slot_id || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value={1}>8:00-9:30</MenuItem>
            <MenuItem value={2}>9:45-11:15</MenuItem>
            <MenuItem value={3}>11:30-13:00</MenuItem>
            <MenuItem value={4}>13:15-14:45</MenuItem>
            <MenuItem value={5}>15:00-16:30</MenuItem>
            <MenuItem value={6}>16:45-18:15</MenuItem>
            <MenuItem value={7}>18:30-20:00</MenuItem>
          </TextField>
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

export default ProposalsPage;