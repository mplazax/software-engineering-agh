import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService.js";

const useEventFormData = () => {
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiRequest("/courses/"),
  });
  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiRequest("/rooms/"),
  });
  return {
    courses: courses || [],
    rooms: rooms || [],
    isLoading: isLoadingCourses || isLoadingRooms,
  };
};

const predefinedTimeSlots = [
  { id: 1, label: "08:00 - 09:30" },
  { id: 2, label: "09:45 - 11:15" },
  { id: 3, label: "11:30 - 13:00" },
  { id: 4, label: "13:15 - 14:45" },
  { id: 5, label: "15:00 - 16:30" },
  { id: 6, label: "16:45 - 18:15" },
  { id: 7, label: "18:30 - 20:00" },
];

const validate = (formData) => {
  const newErrors = {};
  if (!formData.course_id) newErrors.course_id = "Wybór kursu jest wymagany.";
  if (!formData.room_id) newErrors.room_id = "Wybór sali jest wymagany.";
  if (!formData.day) newErrors.day = "Data wydarzenia jest wymagana.";
  if (!formData.time_slot_id)
    newErrors.time_slot_id = "Wybór slotu czasowego jest wymagany.";
  return newErrors;
};

const EventFormDialog = ({ open, onClose, onSave, event }) => {
  const { courses, rooms, isLoading: isLoadingData } = useEventFormData();
  const [formData, setFormData] = useState({
    course_id: "",
    room_id: "",
    day: "",
    time_slot_id: "",
    canceled: false, // Dodane pole
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editMode = !!event;

  useEffect(() => {
    if (open) {
      if (event) {
        setFormData({
          course_id: event.course?.id || event.course_id || "",
          room_id: event.room?.id || event.room_id || "",
          day: event.day || "",
          time_slot_id: event.time_slot_id || "",
          canceled: event.canceled || false, // Inicjalizacja z danych wydarzenia
        });
      } else {
        setFormData({
          course_id: "",
          room_id: "",
          day: "",
          time_slot_id: "",
          canceled: false,
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [event, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
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
        course_id: parseInt(formData.course_id, 10),
        room_id: parseInt(formData.room_id, 10),
        time_slot_id: parseInt(formData.time_slot_id, 10),
      };
      await onSave(payload);
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="event-form-dialog-title"
    >
      <DialogTitle id="event-form-dialog-title">
        {editMode ? "Edytuj wydarzenie" : "Dodaj nowe wydarzenie"}
      </DialogTitle>
      <DialogContent>
        {isLoadingData ? (
          <Stack alignItems="center" sx={{ mt: 3, p: 2 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {errors.general && <Alert severity="error">{errors.general}</Alert>}

            <FormControl fullWidth required error={!!errors.course_id}>
              <InputLabel>Kurs</InputLabel>
              <Select
                name="course_id"
                value={formData.course_id}
                label="Kurs"
                onChange={handleChange}
                disabled={isSubmitting || editMode}
              >
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.group?.name || "Brak grupy"})
                  </MenuItem>
                ))}
              </Select>
              {errors.course_id && (
                <FormHelperText>{errors.course_id}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth required error={!!errors.room_id}>
              <InputLabel>Sala</InputLabel>
              <Select
                name="room_id"
                value={formData.room_id}
                label="Sala"
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {rooms.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.room_id && (
                <FormHelperText>{errors.room_id}</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Data wydarzenia"
              name="day"
              type="date"
              value={formData.day}
              onChange={handleChange}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.day}
              helperText={errors.day}
              disabled={isSubmitting}
            />

            <FormControl fullWidth required error={!!errors.time_slot_id}>
              <InputLabel>Slot czasowy</InputLabel>
              <Select
                name="time_slot_id"
                value={formData.time_slot_id}
                label="Slot czasowy"
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {predefinedTimeSlots.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.time_slot_id && (
                <FormHelperText>{errors.time_slot_id}</FormHelperText>
              )}
            </FormControl>

            {editMode && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.canceled}
                    onChange={handleChange}
                    name="canceled"
                    disabled={isSubmitting}
                  />
                }
                label="Zajęcia anulowane"
              />
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Anuluj
        </Button>
        <Button
          onClick={handleSaveAttempt}
          variant="contained"
          disabled={isSubmitting || isLoadingData}
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

export default EventFormDialog;
