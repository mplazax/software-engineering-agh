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
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService";

const roomTypeTranslations = {
  LECTURE_HALL: "Sala wykładowa",
  LABORATORY: "Laboratorium",
  SEMINAR_ROOM: "Sala seminaryjna",
  CONFERENCE_ROOM: "Sala konferencyjna",
  OTHER: "Inne",
};
const useEquipment = () =>
  useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiRequest("/equipment/"),
  });

const validate = (formData) => {
  const newErrors = {};
  if (!formData.name.trim()) {
    newErrors.name = "Nazwa sali jest wymagana.";
  } else if (formData.name.trim().length < 3) {
    newErrors.name = "Nazwa musi mieć co najmniej 3 znaki.";
  }

  const capacityNum = Number(formData.capacity);
  if (!formData.capacity) {
    newErrors.capacity = "Pojemność jest wymagana.";
  } else if (
    isNaN(capacityNum) ||
    !Number.isInteger(capacityNum) ||
    capacityNum <= 0
  ) {
    newErrors.capacity = "Pojemność musi być dodatnią liczbą całkowitą.";
  }

  if (!formData.type) newErrors.type = "Typ sali jest wymagany.";

  return newErrors;
};

const RoomFormDialog = ({ open, onClose, onSave, room }) => {
  const { data: allEquipment = [], isLoading: isLoadingEquipment } =
    useEquipment();
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    type: "LECTURE_HALL",
    equipment_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editMode = !!room;

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || "",
        capacity: room.capacity || "",
        type: room.type || "LECTURE_HALL",
        equipment_ids: room.equipment?.map((eq) => eq.id) || [],
      });
    } else {
      setFormData({
        name: "",
        capacity: "",
        type: "LECTURE_HALL",
        equipment_ids: [],
      });
    }
    setErrors({});
  }, [room, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleEquipmentChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData((prev) => ({
      ...prev,
      equipment_ids: typeof value === "string" ? value.split(",") : value,
    }));
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
        capacity: parseInt(formData.capacity, 10),
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

  const equipmentNameMap = new Map(allEquipment.map((eq) => [eq.id, eq.name]));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? "Edytuj salę" : "Dodaj nową salę"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {errors.general && <Alert severity="error">{errors.general}</Alert>}
          <TextField
            label="Nazwa"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Pojemność"
            name="capacity"
            type="number"
            fullWidth
            value={formData.capacity}
            onChange={handleChange}
            required
            error={!!errors.capacity}
            helperText={errors.capacity}
          />
          <FormControl fullWidth required error={!!errors.type}>
            <InputLabel>Typ Sali</InputLabel>
            <Select
              name="type"
              value={formData.type}
              label="Typ Sali"
              onChange={handleChange}
            >
              {Object.entries(roomTypeTranslations).map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  {value}
                </MenuItem>
              ))}
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Wyposażenie</InputLabel>
            <Select
              multiple
              name="equipment_ids"
              value={formData.equipment_ids}
              onChange={handleEquipmentChange}
              input={<OutlinedInput label="Wyposażenie" />}
              renderValue={(selected) =>
                selected.map((id) => equipmentNameMap.get(id)).join(", ")
              }
              disabled={isLoadingEquipment}
            >
              {allEquipment.map((eq) => (
                <MenuItem key={eq.id} value={eq.id}>
                  <Checkbox
                    checked={formData.equipment_ids.indexOf(eq.id) > -1}
                  />
                  <ListItemText primary={eq.name} />
                </MenuItem>
              ))}
            </Select>
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

export default RoomFormDialog;
