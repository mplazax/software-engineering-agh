import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";

const validate = (formData) => {
  const newErrors = {};
  if (!formData.name.trim()) {
    newErrors.name = "Nazwa wyposażenia jest wymagana.";
  } else if (formData.name.trim().length < 3) {
    newErrors.name = "Nazwa musi mieć co najmniej 3 znaki.";
  }
  return newErrors;
};

const EquipmentFormDialog = ({ open, onClose, onSave, equipment }) => {
  const [formData, setFormData] = useState({ name: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editMode = !!equipment;

  useEffect(() => {
    if (equipment) {
      setFormData({ name: equipment.name || "" });
    } else {
      setFormData({ name: "" });
    }
    setErrors({});
  }, [equipment, open]);

  const handleChange = (e) => {
    setFormData({ name: e.target.value });
    if (errors.name) {
      setErrors({});
    }
  };

  const handleSaveAttempt = async () => {
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail ||
        error.message ||
        "Wystąpił nieznany błąd.";
      setErrors({ general: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? "Edytuj wyposażenie" : "Dodaj nowe wyposażenie"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {errors.general && <Alert severity="error">{errors.general}</Alert>}
          <TextField
            autoFocus
            label="Nazwa wyposażenia"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
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

export default EquipmentFormDialog;
