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

  const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "ADMIN", group_id: "" });

    useEffect(() => {
      apiRequest("/users")
        .then((data) => setUsers(data))
        .catch((error) => console.error("Error fetching users:", error));
    }, []);

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

    return (
      <Box>
        <Navbar />
        <Box padding={2}>
          <Typography variant="h4">Zarządzaj użytkownikami</Typography>
          <List>
            {users.map((user) => (
              <ListItem key={user.id}>
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