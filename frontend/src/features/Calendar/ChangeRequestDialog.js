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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService";

const ChangeRequestDialog = ({ event, open, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    reason: "",
    room_requirements: "",
    minimum_capacity: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({ reason: "", room_requirements: "", minimum_capacity: "" });
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (newRequest) =>
      apiRequest("/change-requests/", {
        method: "POST",
        body: JSON.stringify(newRequest),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["related-requests"] });
      onClose();
    },
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!event) return;
    mutation.mutate({
      course_event_id: event.id.split("-")[1],
      reason: formData.reason,
      room_requirements: formData.room_requirements,
      minimum_capacity: parseInt(formData.minimum_capacity, 10) || 0,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Zgłoś potrzebę zmiany</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {mutation.isError && (
            <Alert severity="error">{mutation.error.message}</Alert>
          )}
          <TextField
            margin="dense"
            label="Powód zmiany"
            name="reason"
            fullWidth
            multiline
            rows={3}
            value={formData.reason}
            onChange={handleChange}
            required
            disabled={mutation.isPending}
          />
          <TextField
            margin="dense"
            label="Wymagania dotyczące sali (np. Rzutnik, Tablica)"
            name="room_requirements"
            fullWidth
            value={formData.room_requirements}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
          <TextField
            margin="dense"
            label="Minimalna pojemność sali"
            name="minimum_capacity"
            fullWidth
            type="number"
            value={formData.minimum_capacity}
            onChange={handleChange}
            disabled={mutation.isPending}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Anuluj
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Wysyłanie..." : "Wyślij zgłoszenie"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeRequestDialog;
