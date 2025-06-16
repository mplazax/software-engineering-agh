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
  FormHelperText,
} from "@mui/material";

// Funkcja pomocnicza do walidacji emaila
const isEmailValid = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Funkcja walidująca formularz użytkownika po stronie klienta
const validate = (formData, isEditMode) => {
  const newErrors = {};

  if (!formData.name.trim()) newErrors.name = "Imię jest wymagane.";
  if (!formData.surname.trim()) newErrors.surname = "Nazwisko jest wymagane.";

  if (!formData.email.trim()) {
    newErrors.email = "Adres email jest wymagany.";
  } else if (!isEmailValid(formData.email)) {
    newErrors.email = "Wprowadź poprawny adres email.";
  }

  // Walidacja hasła tylko przy tworzeniu nowego użytkownika
  // lub jeśli hasło zostało wpisane podczas edycji
  if (!isEditMode) {
    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Hasło musi mieć co najmniej 8 znaków.";
    }
  } else if (formData.password && formData.password.length < 8) {
    newErrors.password = "Nowe hasło musi mieć co najmniej 8 znaków.";
  }

  if (!formData.role) newErrors.role = "Rola jest wymagana.";

  return newErrors;
};

const UserFormDialog = ({ open, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    role: "PROWADZACY",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editMode = !!user;

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
    setErrors({});
  }, [user, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      const newErrors = { ...errors };
      delete newErrors[e.target.name];
      setErrors(newErrors);
    }
  };

  const handleSaveAttempt = async () => {
    const validationErrors = validate(formData, editMode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = { ...formData };
      if (editMode && !payload.password) {
        delete payload.password;
      }
      await onSave(payload);
      onClose();
    } catch (error) {
      // Obsługa błędów z serwera
      const detail = error.response?.data?.detail;
      if (detail && Array.isArray(detail)) {
        const newErrors = {};
        detail.forEach((err) => {
          if (err.loc && err.loc.length > 1) newErrors[err.loc[1]] = err.msg;
        });
        setErrors(newErrors);
      } else {
        setErrors({ general: error.message || "Wystąpił nieznany błąd." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? "Edytuj użytkownika" : "Dodaj nowego użytkownika"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {errors.general && <Alert severity="error">{errors.general}</Alert>}
          <TextField
            label="Imię"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Nazwisko"
            name="surname"
            fullWidth
            value={formData.surname}
            onChange={handleChange}
            required
            error={!!errors.surname}
            helperText={errors.surname}
          />
          <TextField
            label="Adres Email"
            name="email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            required
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            label="Hasło"
            name="password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            required={!editMode}
            error={!!errors.password}
            helperText={
              errors.password ||
              (editMode
                ? "Pozostaw puste, aby nie zmieniać hasła"
                : "Minimum 8 znaków")
            }
          />
          <FormControl fullWidth required error={!!errors.role}>
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
            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button
          onClick={handleSaveAttempt}
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
