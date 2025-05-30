import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import {useNavigate} from "react-router-dom";

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", year: "", leader_id: "" });

  const navigate = useNavigate();

  // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
    fetchGroups();
  }, [navigate]);

  const fetchGroups = () => {
    apiRequest("/groups")
      .then((data) => setGroups(data))
      .catch((error) => console.error("Error fetching groups:", error));
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    apiRequest("/groups", {
      method: "POST",
      body: JSON.stringify(formData),
    })
      .then((newGroup) => {
        setGroups((prev) => [...prev, newGroup]);
        handleClose();
      })
      .catch((error) => console.error("Error adding group:", error));
  };

  const handleDelete = (groupId) => {
    // Optimistically update the UI
    setGroups((prev) => prev.filter((group) => group.id !== groupId));

    // Send the delete request to the backend
    apiRequest(`/groups/${groupId}`, { method: "DELETE" })
      .catch((error) => {
        console.error("Error deleting group:", error);
        // Revert the UI update if the request fails
        fetchGroups();
      });
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Zarządzaj grupami</Typography>
        <List>
          {groups.map((group) => (
            <ListItem
              key={group.id}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDelete(group.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={`${group.name} - Rok: ${group.year || "Brak danych"}`} />
            </ListItem>
          ))}
        </List>
        <Button variant="contained" onClick={handleOpen}>
          Dodaj grupę
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj grupę</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nazwa"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Rok"
            name="year"
            type="number"
            fullWidth
            value={formData.year}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="ID lidera"
            name="leader_id"
            fullWidth
            value={formData.leader_id}
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

export default GroupsPage;