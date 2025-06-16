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

const useTeachers = () =>
  useQuery({
    queryKey: ["users", { role: "PROWADZACY" }],
    queryFn: async () =>
      (await apiRequest("/users/")).filter((u) => u.role === "PROWADZACY"),
  });
const useGroups = () =>
  useQuery({ queryKey: ["groups"], queryFn: () => apiRequest("/groups/") });

const validate = (formData) => {
  const newErrors = {};
  if (!formData.name.trim()) newErrors.name = "Nazwa kursu jest wymagana.";
  if (!formData.teacher_id)
    newErrors.teacher_id = "Wybór prowadzącego jest wymagany.";
  if (!formData.group_id) newErrors.group_id = "Wybór grupy jest wymagany.";
  return newErrors;
};

const CourseFormDialog = ({ open, onClose, onSave, course }) => {
  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeachers();
  const { data: groups = [], isLoading: isLoadingGroups } = useGroups();
  const [formData, setFormData] = useState({
    name: "",
    teacher_id: "",
    group_id: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editMode = !!course;

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
    setErrors({});
  }, [course, open]);

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
      await onSave(formData);
      onClose();
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail && Array.isArray(detail)) {
        const newErrors = {};
        detail.forEach((err) => {
          if (err.loc && err.loc.length > 1) newErrors[err.loc[1]] = err.msg;
        });
        setErrors(newErrors);
      } else {
        setErrors({ general: error.message || "Wystąpił nieznany błąd." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editMode ? "Edytuj kurs" : "Dodaj nowy kurs"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {errors.general && <Alert severity="error">{errors.general}</Alert>}
          <TextField
            label="Nazwa kursu"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          <FormControl fullWidth required error={!!errors.teacher_id}>
            <InputLabel>Prowadzący</InputLabel>
            <Select
              name="teacher_id"
              value={formData.teacher_id}
              label="Prowadzący"
              onChange={handleChange}
              disabled={isLoadingTeachers}
            >
              {teachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.surname}
                </MenuItem>
              ))}
            </Select>
            {errors.teacher_id && (
              <FormHelperText>{errors.teacher_id}</FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth required error={!!errors.group_id}>
            <InputLabel>Grupa</InputLabel>
            <Select
              name="group_id"
              value={formData.group_id}
              label="Grupa"
              onChange={handleChange}
              disabled={isLoadingGroups}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
            {errors.group_id && (
              <FormHelperText>{errors.group_id}</FormHelperText>
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

export default CourseFormDialog;
