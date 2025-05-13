import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", year: "", leader_id: "" });

  useEffect(() => {
    apiRequest("/groups")
      .then((data) => setGroups(data))
      .catch((error) => console.error("Error fetching groups:", error));
  }, []);

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

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Zarządzaj grupami</Typography>
        <List>
          {groups.map((group) => (
            <ListItem key={group.id}>
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