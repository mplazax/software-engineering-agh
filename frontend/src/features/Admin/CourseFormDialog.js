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

const useTeachers = () =>
  useQuery({
    queryKey: ["users", { role: "PROWADZACY" }],
    queryFn: async () => {
      const users = await apiRequest("/users");
      return users.filter((user) => user.role === "PROWADZACY");
    },
  });
const useGroups = () =>
  useQuery({ queryKey: ["groups"], queryFn: () => apiRequest("/groups") });

const CourseFormDialog = ({ open, onClose, onSave, course }) => {
  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeachers();
  const { data: groups = [], isLoading: isLoadingGroups } = useGroups();
  const [formData, setFormData] = useState({
    name: "",
    teacher_id: "",
    group_id: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || "",
        teacher_id: course.teacher_id || "",
        group_id: course.group_id || "",
      });
    } else {
      setFormData({ name: "", teacher_id: "", group_id: "" });
    }
    setError("");
  }, [course, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    const result = await onSave(formData);
    setIsSubmitting(false);
    if (result instanceof Error) {
      setError(result.message);
    } else {
      onClose();
    }
  };

  const editMode = !!course;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? "Edytuj kurs" : "Dodaj nowy kurs"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nazwa kursu"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            select
            label="Prowadzący"
            name="teacher_id"
            fullWidth
            value={formData.teacher_id}
            onChange={handleChange}
            required
            disabled={isLoadingTeachers}
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Grupa"
            name="group_id"
            fullWidth
            value={formData.group_id}
            onChange={handleChange}
            required
            disabled={isLoadingGroups}
          >
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
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
          {isSubmitting ? "Zapisywanie..." : "Dodaj"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseFormDialog;
