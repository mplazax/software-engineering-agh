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

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "ADMIN", group_id: "" });

  const navigate = useNavigate();

  // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
    fetchUsers();
    fetchCurrentUser();
  }, [navigate]);
  

  const fetchUsers = () => {
    apiRequest("/users")
      .then((data) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
  };

  const fetchCurrentUser = () => {
    apiRequest("/users/me")
      .then((data) => setCurrentUserId(data.id))
      .catch((error) => console.error("Error fetching current user:", error));
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    apiRequest("/users/create", {
      method: "POST",
      body: JSON.stringify(formData),
    })
      .then((newUser) => {
        setUsers((prev) => [...prev, newUser]);
        handleClose();
      })
      .catch((error) => console.error("Error adding user:", error));
  };

  const handleDelete = (userId) => {
    // Optimistically update the UI
    setUsers((prev) => prev.filter((user) => user.id !== userId));

    // Send the delete request to the backend
    apiRequest(`/users/${userId}`, { method: "DELETE" })
      .catch((error) => {
        console.error("Error deleting user:", error);
        // Revert the UI update if the request fails
        fetchUsers();
      });
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Zarządzaj użytkownikami</Typography>
        <List>
          {users.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(user.id)}
                  disabled={user.id === currentUserId} // Disable button for current user
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={`${user.name} - ${user.email}`} />
            </ListItem>
          ))}
        </List>
        <Button variant="contained" onClick={handleOpen}>
          Dodaj użytkownika
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj użytkownika</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Imię i nazwisko"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Hasło"
            name="password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Rola"
            name="role"
            fullWidth
            value={formData.role}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="ID grupy"
            name="group_id"
            fullWidth
            value={formData.group_id}
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

export default UsersPage;