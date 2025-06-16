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
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService";

const useLeaders = () => {
  return useQuery({
    queryKey: ["users", { role: "STAROSTA" }],
    queryFn: async () => {
      const users = await apiRequest("/users");
      return users.filter((user) => user.role === "STAROSTA");
    },
  });
};

const GroupFormDialog = ({ open, onClose, onSave, group }) => {
  const { data: leaders = [], isLoading: isLoadingLeaders } = useLeaders();
  const [formData, setFormData] = useState({
    name: "",
    year: "",
    leader_id: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setError("");
  }, [group, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    const payload = {
      ...formData,
      year: parseInt(formData.year, 10) || null,
      leader_id: parseInt(formData.leader_id, 10) || null,
    };
    const result = await onSave(payload);
    setIsSubmitting(false);
    if (result instanceof Error) {
      setError(result.message);
    } else {
      onClose();
    }
  };

  const editMode = !!group;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? "Edytuj grupę" : "Dodaj nową grupę"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nazwa grupy"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            label="Rok studiów"
            name="year"
            type="number"
            fullWidth
            value={formData.year}
            onChange={handleChange}
            required
          />
          <TextField
            select
            label="Starosta"
            name="leader_id"
            fullWidth
            value={formData.leader_id}
            onChange={handleChange}
            required
            disabled={isLoadingLeaders}
          >
            {leaders.map((leader) => (
              <MenuItem key={leader.id} value={leader.id}>
                {leader.name} {leader.surname}
              </MenuItem>
            ))}
          </TextField>
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

export default GroupFormDialog;
