// frontend/src/pages/AvailabilityPage.js
import React, {useEffect, useState} from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { apiRequest } from "../services/apiService";
import Navbar from "../components/Navbar";
import {useNavigate} from "react-router-dom";

const AvailabilityPage = () => {
  const [formData, setFormData] = useState({ change_request_id: "", start_date: "", end_date: "" });
  const navigate = useNavigate();

    // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        navigate("/login", { replace: true });
    }
  }, [navigate]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    apiRequest("/proposals", {
      method: "POST",
      body: JSON.stringify({
        change_request_id: formData.change_request_id,
        interval: {
          start_date: formData.start_date,
          end_date: formData.end_date,
        },
      }),
    })
      .then(() => alert("Dostępność została zgłoszona"))
      .catch((error) => console.error("Błąd podczas zgłaszania dostępności:", error));
  };

  return (
    <Box>
        <Navbar />
      <Typography variant="h4">Wskaż Dostępność</Typography>
      <TextField label="ID Zgłoszenia" name="change_request_id" onChange={handleChange} />
      <TextField label="Data Początkowa" name="start_date" type="datetime-local" onChange={handleChange} />
      <TextField label="Data Końcowa" name="end_date" type="datetime-local" onChange={handleChange} />
      <Button onClick={handleSubmit}>Wyślij</Button>
    </Box>
  );
};

export default AvailabilityPage;