import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Box,
  FormHelperText,
  ListItemText,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService";
import { useNotification } from "../../contexts/NotificationContext";

const useEquipment = () =>
  useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiRequest("/equipment/"),
  });

const ChangeRequestDialog = ({ event, open, onClose }) => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const { data: allEquipment = [], isLoading: isLoadingEquipment } =
    useEquipment();

  const [formData, setFormData] = useState({
    reason: "",
    equipment_names: [],
    minimum_capacity: "",
    cyclical: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({
        reason: "",
        equipment_names: [],
        minimum_capacity: "",
        cyclical: false,
      });
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const newErrors = {};
    if (!formData.reason.trim()) {
      newErrors.reason = "Powód zmiany jest wymagany.";
    }
    const capacity = Number(formData.minimum_capacity);
    if (formData.minimum_capacity && (isNaN(capacity) || capacity < 0)) {
      newErrors.minimum_capacity = "Pojemność musi być liczbą nieujemną.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (newRequest) =>
      apiRequest("/change-requests/", {
        method: "POST",
        body: JSON.stringify(newRequest),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["related-requests-all"] });
      showNotification(
        "Zgłoszenie potrzeby zmiany zostało pomyślnie wysłane.",
        "success"
      );
      onClose();
    },
    onError: (error) => showNotification(`Błąd: ${error.message}`, "error"),
  });

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

  const handleSubmit = () => {
    if (!validate() || !event) return;

    mutation.mutate({
      course_event_id: event.id.split("-")[1],
      reason: formData.reason,
      room_requirements: formData.equipment_names.join(","), // Przekształcamy na string dla backendu
      minimum_capacity: parseInt(formData.minimum_capacity, 10) || 0,
      cyclical: formData.cyclical,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Zgłoś potrzebę zmiany</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
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
            error={!!errors.reason}
            helperText={errors.reason}
            disabled={mutation.isPending}
          />
          <FormControl fullWidth>
            <InputLabel>Wymagane wyposażenie</InputLabel>
            <Select
              multiple
              name="equipment_names"
              value={formData.equipment_names}
              onChange={handleChange}
              input={<OutlinedInput label="Wymagane wyposażenie" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              disabled={isLoadingEquipment || mutation.isPending}
            >
              {allEquipment.map((eq) => (
                <MenuItem key={eq.id} value={eq.name}>
                  <Checkbox
                    checked={formData.equipment_names.indexOf(eq.name) > -1}
                  />
                  <ListItemText primary={eq.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Minimalna pojemność sali"
            name="minimum_capacity"
            fullWidth
            type="number"
            value={formData.minimum_capacity}
            onChange={handleChange}
            error={!!errors.minimum_capacity}
            helperText={errors.minimum_capacity}
            disabled={mutation.isPending}
          />
          <Box position="relative">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.cyclical}
                  onChange={handleChange}
                  name="cyclical"
                  disabled={mutation.isPending}
                />
              }
              label="Zmiana cykliczna"
            />
            <Tooltip title="Zaznacz, jeśli zmiana ma dotyczyć wszystkich przyszłych zajęć w tym cyklu (np. wszystkich poniedziałkowych wykładów o 10:00), a nie tylko tego jednego terminu.">
              <IconButton
                size="small"
                sx={{ position: "absolute", top: 4, right: -5 }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
