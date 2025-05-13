import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", teacher_id: "", group_id: "" });

  useEffect(() => {
    apiRequest("/courses")
      .then((data) => setCourses(data))
      .catch((error) => console.error("Error fetching courses:", error));
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    apiRequest("/courses", {
      method: "POST",
      body: JSON.stringify(formData),
    })
      .then((newCourse) => {
        setCourses((prev) => [...prev, newCourse]);
        handleClose();
      })
      .catch((error) => console.error("Error adding course:", error));
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Zarządzaj kursami</Typography>
        <List>
          {courses.map((course) => (
            <ListItem key={course.id}>
              <ListItemText primary={`${course.name} - Prowadzący: ${course.teacher_id}`} />
            </ListItem>
          ))}
        </List>
        <Button variant="contained" onClick={handleOpen}>
          Dodaj kurs
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj kurs</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nazwa"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="ID prowadzącego"
            name="teacher_id"
            fullWidth
            value={formData.teacher_id}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="ID grupy"
            name="group_id"
            fullWidth
            value={formData.group_id}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Anuluj</Button>
          <Button onClick={handleSubmit} variant="contained">
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursesPage;