import React, { useEffect, useState } from "react";
          import { Box, Typography, Button, List, ListItem, ListItemText } from "@mui/material";
          import Navbar from "../components/Navbar";
          import { apiRequest } from "../services/apiService";

          const CoursesPage = () => {
            const [courses, setCourses] = useState([]);

            useEffect(() => {
              apiRequest("/courses")
                .then((data) => {
                  if (Array.isArray(data)) {
                    setCourses(data);
                  } else {
                    console.error("Unexpected data format:", data);
                  }
                })
                .catch((error) => console.error("Error fetching courses:", error));
            }, []);

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
                  <Button variant="contained" onClick={() => alert("Dodaj kurs")}>
                    Dodaj kurs
                  </Button>
                </Box>
              </Box>
            );
          };

          export default CoursesPage;