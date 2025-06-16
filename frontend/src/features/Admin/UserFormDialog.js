import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";

const UserFormDialog = ({ open, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "PROWADZACY",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        password: "",
        role: user.role || "PROWADZACY",
      });
    } else {
      setFormData({
        name: "",
        surname: "",
        email: "",
        password: "",
        role: "PROWADZACY",
      });
    }
    setError("");
  }, [user, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    const result = await onSave(formData);
    setIsSubmitting(false);
    if (result instanceof Error) {
      setError(result.message);
    } else {
      onClose();
    }
  };

  const editMode = !!user;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? "Edytuj użytkownika" : "Dodaj nowego użytkownika"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Imię"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            label="Nazwisko"
            name="surname"
            fullWidth
            value={formData.surname}
            onChange={handleChange}
            required
          />
          <TextField
            label="Adres Email"
            name="email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            required
          />
          <TextField
            label="Hasło"
            name="password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            required={!editMode}
            helperText={
              editMode ? "Pozostaw puste, aby nie zmieniać hasła" : ""
            }
          />
          <FormControl fullWidth>
            <InputLabel>Rola</InputLabel>
            <Select
              name="role"
              value={formData.role}
              label="Rola"
              onChange={handleChange}
            >
              <MenuItem value="PROWADZACY">Prowadzący</MenuItem>
              <MenuItem value="STAROSTA">Starosta</MenuItem>
              <MenuItem value="KOORDYNATOR">Koordynator</MenuItem>
              <MenuItem value="ADMIN">Administrator</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Zapisywanie..."
            : editMode
            ? "Zapisz zmiany"
            : "Dodaj"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormDialog;
