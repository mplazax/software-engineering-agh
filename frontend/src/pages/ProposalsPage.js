import React, { useEffect, useState } from "react";
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const ProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ change_request_id: "", user_id: "", day: "", time_slot_id: "" });
  const [userDetails, setUserDetails] = useState({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [courseNames, setCourseNames] = useState({});
  const navigate = useNavigate();

  // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
    const userId = localStorage.getItem("user_id");
    setCurrentUserId(userId || "");

    apiRequest("/proposals")
      .then(async (data) => {
        setProposals(data);

        // Pobierz dane użytkowników tylko dla unikalnych user_id z proposals
        const uniqueUserIds = [...new Set(data.map((p) => p.user_id))];
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

        // Pobierz nazwy kursów dla każdej propozycji
        const courseNameMap = {};
        await Promise.all(
          data.map(async (proposal) => {
            try {
              // 1. change_request_id z proposal
              const changeRequestId = proposal.change_request_id;
              if (!changeRequestId) return;
              // 2. change_request
              const changeRequest = await apiRequest(`/change_requests/${changeRequestId}?request_id=${changeRequestId}`);
              // 3. course_event_id
              const courseEventId = changeRequest.course_event_id;
              if (!courseEventId) return;
              // 4. course_event
              const courseEvent = await apiRequest(`/courses/${courseEventId}/events`);
              // 5. course_id
              const courseId = courseEvent[0].course_id;
              if (!courseId) return;
              // 6. course
              const course = await apiRequest(`/courses/${courseId}`);
              // 7. name
              courseNameMap[proposal.id] = course.name || "Nieznany kurs";
            } catch {
              courseNameMap[proposal.id] = "Nieznany kurs";
            }
          })
        );
        setCourseNames(courseNameMap);
      })
      .catch((error) => console.error("Error fetching proposals:", error));
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

  // Usuwanie propozycji
  const handleDelete = (proposalId) => {
    // Optimistycznie usuń z UI
    setProposals((prev) => prev.filter((proposal) => proposal.id !== proposalId));

    // Wyślij żądanie DELETE do backendu
    apiRequest(`/proposals/${proposalId}`, { method: "DELETE" })
      .catch((error) => {
        console.error("Error deleting proposal:", error);
        // Przy błędzie pobierz ponownie listę
        apiRequest("/proposals")
          .then((data) => setProposals(data))
          .catch(() => {});
      });
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        {/* Dodaj poniżej */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Twoje proposals ID:{" "}
          {proposals
            .filter((p) => String(p.user_id) === String(currentUserId))
            .map((p) => p.id)
            .join(", ") || "Brak"}
        </Typography>
        <Typography variant="h4">Zarządzaj propozycjami</Typography>
        <List>
          {proposals.map((proposal) => {
            const user = userDetails[proposal.user_id];
            const courseName = courseNames[proposal.id];

            // Funkcja do tłumaczenia numeru slotu na zakres godzin
            const timeSlotMap = {
              1: "8:00-9:30",
              2: "9:45-11:15",
              3: "11:30-13:00",
              4: "13:15-14:45",
              5: "15:00-16:30",
              6: "16:45-18:15",
              7: "18:30-20:00",
            };

            // Formatowanie daty
            const formatDay = (dateStr) => {
              if (!dateStr) return "";
              try {
                return format(new Date(dateStr), "d MMMM yyyy", { locale: pl });
              } catch {
                return dateStr;
              }
            };

            return (
              <ListItem
                key={proposal.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleDelete(proposal.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <>
                      <Typography variant="h6">
                        {courseName ? `Kurs: ${courseName}` : "Kurs: [ładowanie...]"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user
                          ? `Od: ${user.name} (${user.email})`
                          : `Od: [ładowanie...]`}
                      </Typography>
                    </>
                  }
                  secondary={
                    proposal.day && proposal.time_slot_id
                      ? `Dzień: ${formatDay(proposal.day)}, Slot: ${timeSlotMap[proposal.time_slot_id] || "nieznany"}`
                      : "Brak danych o terminie"
                  }
                />
              </ListItem>
            );
          })}
        </List>
        <Button variant="contained" onClick={handleOpen}>
          Dodaj propozycję
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj propozycję</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="ID zgłoszenia zmiany"
            name="change_request_id"
            fullWidth
            value={formData.change_request_id}
            onChange={handleChange}
          />
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