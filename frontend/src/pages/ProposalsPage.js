import React, { useEffect, useState } from "react";
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const ProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ change_request_id: "", user_id: "", start_date: "", end_date: "" });
  const [userDetails, setUserDetails] = useState({});
  const [currentUserId, setCurrentUserId] = useState("");
  const navigate = useNavigate();

  // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
    // Zakładam, że user_id jest w localStorage (dostosuj jeśli inaczej)
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
        interval: {
          start_date: formData.start_date,
          end_date: formData.end_date,
        },
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
            // Formatowanie daty
            const formatDate = (dateStr) => {
              if (!dateStr) return "";
              try {
                return format(new Date(dateStr), "d MMMM yyyy HH:mm", { locale: pl });
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
                    user
                      ? `Użytkownik: ${user.name} (${user.email})`
                      : `Użytkownik: [ładowanie...]`
                  }
                  secondary={`Od: ${formatDate(proposal.available_start_datetime)}, Do: ${formatDate(proposal.available_end_datetime)}`}
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
          {/* Usunięto pole ID użytkownika */}
          <TextField
            margin="dense"
            name="start_date"
            type="datetime-local"
            fullWidth
            value={formData.start_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            label="Data początkowa"
          />
          <TextField
            margin="dense"
            name="end_date"
            type="datetime-local"
            fullWidth
            value={formData.end_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            label="Data końcowa"
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

export default ProposalsPage;