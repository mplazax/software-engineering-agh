import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Card, CardContent, CardActionArea,
  IconButton, List, ListItem, ListItemText
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import { useNavigate } from "react-router-dom";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString();
};

const ProposalsPage = () => {
  const [changeRequests, setChangeRequests] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [courseNames, setCourseNames] = useState({});
  const [selectedCR, setSelectedCR] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [newProposal, setNewProposal] = useState({ day: "", time_slot_id: "" });
  const [eventDays, setEventDays] = useState({});
  const navigate = useNavigate();

  const TIME_SLOTS = [
    "8:00-9:30",
    "9:45-11:15",
    "11:30-13:00",
    "13:15-14:45",
    "15:00-16:30",
    "16:45-18:15",
    "18:30-20:00",
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login", { replace: true });

    apiRequest("/change_requests/related?status=PENDING").then(async (data) => {
      setChangeRequests(data);

      const userMap = {};
      const uniqueUserIds = [...new Set(data.map((cr) => cr.user_id))];
      await Promise.all(uniqueUserIds.map(async (id) => {
        try {
          const user = await apiRequest(`/users/${id}`);
          userMap[id] = user;
        } catch {
          userMap[id] = { name: "Nieznany", email: "" };
        }
      }));
      setUserDetails(userMap);

      const courseMap = {};
      await Promise.all(data.map(async (cr) => {
        try {
          const event = await apiRequest(`/courses/${cr.course_event_id}/events`);
          const course = await apiRequest(`/courses/${event[0]?.course_id}`);
          courseMap[cr.id] = course?.name || "Nieznany kurs";
        } catch {
          courseMap[cr.id] = "Nieznany kurs";
        }
      }));
      setCourseNames(courseMap);

      const eventDayMap = {};
      await Promise.all(data.map(async (cr) => {
        try {
          const event = await apiRequest(`/courses/events/${cr.course_event_id}`);
          eventDayMap[cr.course_event_id] = event.day;
        } catch {
          eventDayMap[cr.course_event_id] = null;
        }
      }));
      setEventDays(eventDayMap);

    });
  }, [navigate]);

  const openDialogForChangeRequest = async (cr) => {
    setSelectedCR(cr);
    setDialogOpen(true);
    try {
      const data = await apiRequest(`/proposals/by-change-id/${cr.id}`);
      setProposals(data);
    } catch (e) {
      console.error("Error loading proposals:", e);
      setProposals([]);
    }
  };

  const handleAddProposal = async () => {
    try {
      const user = await apiRequest("/auth/me");
      const payload = {
        user_id: user.id,
        change_request_id: selectedCR.id,
        day: newProposal.day,
        time_slot_id: Number(newProposal.time_slot_id),
      };
      const created = await apiRequest("/proposals", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setProposals(prev => [...prev, created]);
      setNewProposal({ day: "", time_slot_id: "" });
    } catch (e) {
      console.error("Error creating proposal", e);
    }
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Propozycje zmian</Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {changeRequests.map((cr) => {
            const user = userDetails[cr.initiator_id];
            const courseName = courseNames[cr.id];
            const cardBg = cr.status === "PENDING"
              ? "#fff9c4"
              : "#fff";

            return (
              <Card
                key={cr.id}
                sx={{padding: "1rem", backgroundColor: cardBg, border: "1px solid #ddd" }}
                variant="outlined"
              >
                <CardActionArea onClick={() => openDialogForChangeRequest(cr)}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Kurs: {courseName}
                    </Typography>
                    <Typography variant="body2">
                      Data oryginalna: {eventDays[cr.course_event_id] ? new Date(eventDays[cr.course_event_id]).toLocaleDateString() : "brak"}
                    </Typography>
                    <Typography variant="body2">Powód: {cr.reason}</Typography>
                    <Typography variant="body2">Wymagania sali: {cr.room_requirements}</Typography>
                    <Typography variant="body2">Pojemność: {cr.minimum_capacity}</Typography>
                    <Typography variant="body2">Utworzono: {formatDateTime(cr.created_at)}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>
          Propozycje zmiany terminu
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1">Istniejące propozycje:</Typography>
          <List>
            {proposals.map(p => (
              <ListItem
                key={p.id}
              >
                <ListItemText
                    primary={`Dzień: ${p.day} — ${TIME_SLOTS[(p.time_slot_id || 1) - 1]}`}
                />
              </ListItem>
            ))}
          </List>

          <Typography variant="subtitle2" mt={2}>Dodaj nową propozycję:</Typography>
          <TextField
            fullWidth
            label="Dzień"
            type="date"
            value={newProposal.day}
            onChange={(e) => setNewProposal(prev => ({ ...prev, day: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Slot czasowy"
            value={newProposal.time_slot_id}
            onChange={(e) => setNewProposal(prev => ({ ...prev, time_slot_id: e.target.value }))}
            margin="normal"
          >
            {[1,2,3,4,5,6,7].map(i => (
              <MenuItem key={i} value={i}>
                {[ "8:00-9:30", "9:45-11:15", "11:30-13:00", "13:15-14:45", "15:00-16:30", "16:45-18:15", "18:30-20:00" ][i - 1]}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Zamknij</Button>
          <Button onClick={handleAddProposal} variant="contained">Dodaj</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalsPage;