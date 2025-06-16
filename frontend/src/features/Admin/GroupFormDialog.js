import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
  Alert,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService";

const useLeaders = () => {
  return useQuery({
    queryKey: ["users", { role: "STAROSTA" }],
    queryFn: async () =>
      (await apiRequest("/users/")).filter((user) => user.role === "STAROSTA"),
  });
};

const validate = (formData) => {
  const newErrors = {};
  if (!formData.name.trim()) newErrors.name = "Nazwa grupy jest wymagana.";
  else if (formData.name.trim().length < 3)
    newErrors.name = "Nazwa grupy musi mieć co najmniej 3 znaki.";

  const yearNum = Number(formData.year);
  if (!formData.year) {
    newErrors.year = "Rok jest wymagany.";
  } else if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 5) {
    newErrors.year = "Rok musi być liczbą od 1 do 5.";
  }
  if (!formData.leader_id)
    newErrors.leader_id = "Wybór starosty jest wymagany.";
  return newErrors;
};

const GroupFormDialog = ({ open, onClose, onSave, group }) => {
  const { data: leaders = [], isLoading: isLoadingLeaders } = useLeaders();
  const [formData, setFormData] = useState({
    name: "",
    year: "",
    leader_id: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editMode = !!group;

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || "",
        year: group.year || "",
        leader_id: group.leader_id || "",
      });
    } else {
      setFormData({ name: "", year: "", leader_id: "" });
    }
    setErrors({});
  }, [group, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      const newErrors = { ...errors };
      delete newErrors[e.target.name];
      setErrors(newErrors);
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
      const payload = {
        ...formData,
        year: parseInt(formData.year, 10),
        leader_id: parseInt(formData.leader_id, 10),
      };
      await onSave(payload);
      onClose();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail ||
        error.message ||
        "Wystąpił nieznany błąd.";
      if (Array.isArray(errorMsg)) {
        const newErrors = {};
        errorMsg.forEach((err) => {
          if (err.loc && err.loc.length > 1) newErrors[err.loc[1]] = err.msg;
        });
        setErrors(newErrors);
      } else {
        setErrors({ general: errorMsg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? "Edytuj grupę" : "Dodaj nową grupę"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {errors.general && <Alert severity="error">{errors.general}</Alert>}
          <TextField
            label="Nazwa grupy"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Rok studiów"
            name="year"
            type="number"
            fullWidth
            value={formData.year}
            onChange={handleChange}
            required
            error={!!errors.year}
            helperText={errors.year}
          />
          <FormControl fullWidth required error={!!errors.leader_id}>
            <InputLabel>Starosta</InputLabel>
            <Select
              name="leader_id"
              value={formData.leader_id}
              label="Starosta"
              onChange={handleChange}
              disabled={isLoadingLeaders}
            >
              {leaders.map((leader) => (
                <MenuItem key={leader.id} value={leader.id}>
                  {leader.name} {leader.surname}
                </MenuItem>
              ))}
            </Select>
            {errors.leader_id && (
              <FormHelperText>{errors.leader_id}</FormHelperText>
            )}
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

export default GroupFormDialog;
