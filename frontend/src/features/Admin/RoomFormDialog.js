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

const useEquipment = () => {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiRequest("/equipment"),
  });
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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setError("");
  }, [room, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    const payload = {
      ...formData,
      capacity: parseInt(formData.capacity, 10) || 0,
    };
    const result = await onSave(payload);
    setIsSubmitting(false);
    if (result instanceof Error) {
      setError(result.message);
    } else {
      onClose();
    }
  };

  const editMode = !!room;
  const equipmentNameMap = new Map(allEquipment.map((eq) => [eq.id, eq.name]));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? "Edytuj salę" : "Dodaj nową salę"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nazwa"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            label="Pojemność"
            name="capacity"
            type="number"
            fullWidth
            value={formData.capacity}
            onChange={handleChange}
            required
          />
          <FormControl fullWidth>
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

export default RoomFormDialog;
