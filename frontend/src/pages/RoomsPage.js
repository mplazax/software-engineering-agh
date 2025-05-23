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
  MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import {useNavigate} from "react-router-dom";

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", capacity: "", equipment: "", type: "" });

  const roomTypeTranslations = {
    LECTURE_HALL: "Sala wykładowa",
    LABORATORY: "Laboratorium",
    SEMINAR_ROOM: "Sala seminaryjna",
    CONFERENCE_ROOM: "Sala konferencyjna",
    OTHER: "Inne",
  };

  const navigate = useNavigate();

  // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
    fetchRooms();
  }, [navigate]);

  const fetchRooms = () => {
    apiRequest("/rooms")
      .then((data) => setRooms(data))
      .catch((error) => console.error("Error fetching rooms:", error));
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = () => {
    apiRequest("/rooms", {
      method: "POST",
      body: JSON.stringify(formData),
    })
      .then((newRoom) => {
        setRooms((prev) => [...prev, newRoom]);
        handleClose();
      })
      .catch((error) => console.error("Error adding room:", error));
  };

  const handleDelete = (roomId) => {
    // Optimistically update the UI
    setRooms((prev) => prev.filter((room) => room.id !== roomId));

    // Send the delete request to the backend
    apiRequest(`/rooms/${roomId}`, { method: "DELETE" })
      .catch((error) => {
        console.error("Error deleting room:", error);
        // Revert the UI update if the request fails
        fetchRooms();
      });
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Zarządzaj salami</Typography>
        <List>
          {rooms.map((room) => (
            <ListItem
              key={room.id}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDelete(room.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={`${room.name} - ${room.capacity || "Brak danych"} miejsc`} />
            </ListItem>
          ))}
        </List>
        <Button variant="contained" onClick={handleOpen}>
          Dodaj salę
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj salę</DialogTitle>
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
            label="Pojemność"
            name="capacity"
            type="number"
            fullWidth
            value={formData.capacity}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Wyposażenie"
            name="equipment"
            fullWidth
            value={formData.equipment}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Typ"
            name="type"
            select
            fullWidth
            value={formData.type}
            onChange={handleChange}
          >
            {Object.entries(roomTypeTranslations).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {value}
              </MenuItem>
            ))}
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

export default RoomsPage;