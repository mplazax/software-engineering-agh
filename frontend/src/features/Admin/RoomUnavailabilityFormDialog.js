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
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService";

const useRooms = () =>
  useQuery({ queryKey: ["rooms"], queryFn: () => apiRequest("/rooms/") });

const validate = (formData) => {
  const newErrors = {};
  if (!formData.room_id) newErrors.room_id = "Wybór sali jest wymagany.";
  if (!formData.start_datetime)
    newErrors.start_datetime = "Data rozpoczęcia jest wymagana.";
  if (!formData.end_datetime)
    newErrors.end_datetime = "Data zakończenia jest wymagana.";

  if (
    formData.start_datetime &&
    formData.end_datetime &&
    formData.start_datetime >= formData.end_datetime
  ) {
    newErrors.end_datetime =
      "Data zakończenia musi być późniejsza niż data rozpoczęcia.";
  }

  if (!formData.reason.trim())
    newErrors.reason = "Powód blokady jest wymagany.";

  return newErrors;
};

const RoomUnavailabilityFormDialog = ({
  open,
  onClose,
  onSave,
  unavailability,
}) => {
  const { data: rooms = [], isLoading: isLoadingRooms } = useRooms();

  const getInitialState = () => ({
    room_id: unavailability?.room_id || "",
    start_datetime: unavailability
      ? new Date(unavailability.start_datetime)
      : null,
    end_datetime: unavailability ? new Date(unavailability.end_datetime) : null,
    reason: unavailability?.reason || "",
  });

  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData(getInitialState());
      setErrors({});
    }
  }, [unavailability, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSaveAttempt = async () => {
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Konwertuj daty na format ISO, którego oczekuje backend
    const payload = {
      ...formData,
      start_datetime: formData.start_datetime.toISOString(),
      end_datetime: formData.end_datetime.toISOString(),
    };

    try {
      await onSave(payload);
      onClose();
    } catch (e) {
      // Błędy z serwera będą obsłużone przez hook useCrud
      console.error("Save failed:", e);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {unavailability ? "Edytuj blokadę sali" : "Dodaj nową blokadę sali"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <FormControl fullWidth required error={!!errors.room_id}>
            <InputLabel>Sala</InputLabel>
            <Select
              name="room_id"
              value={formData.room_id}
              label="Sala"
              onChange={handleChange}
              disabled={isLoadingRooms}
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
            {errors.room_id && (
              <FormHelperText>{errors.room_id}</FormHelperText>
            )}
          </FormControl>
          <DateTimePicker
            label="Początek blokady"
            value={formData.start_datetime}
            onChange={(date) => handleDateChange("start_datetime", date)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                error: !!errors.start_datetime,
                helperText: errors.start_datetime,
              },
            }}
          />
          <DateTimePicker
            label="Koniec blokady"
            value={formData.end_datetime}
            onChange={(date) => handleDateChange("end_datetime", date)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                error: !!errors.end_datetime,
                helperText: errors.end_datetime,
              },
            }}
          />
          <TextField
            label="Powód blokady"
            name="reason"
            fullWidth
            multiline
            rows={2}
            value={formData.reason}
            onChange={handleChange}
            required
            error={!!errors.reason}
            helperText={errors.reason}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={onClose}>Anuluj</Button>
        <Button onClick={handleSaveAttempt} variant="contained">
          {unavailability ? "Zapisz zmiany" : "Dodaj blokadę"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomUnavailabilityFormDialog;
