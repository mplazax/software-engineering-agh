// frontend/src/pages/AvailabilityPage.js
import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { apiRequest } from "../services/apiService";

const AvailabilityPage = () => {
  const [formData, setFormData] = useState({ change_request_id: "", start_date: "", end_date: "" });

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
      <Typography variant="h4">Wskaż Dostępność</Typography>
      <TextField label="ID Zgłoszenia" name="change_request_id" onChange={handleChange} />
      <TextField label="Data Początkowa" name="start_date" type="datetime-local" onChange={handleChange} />
      <TextField label="Data Końcowa" name="end_date" type="datetime-local" onChange={handleChange} />
      <Button onClick={handleSubmit}>Wyślij</Button>
    </Box>
  );
};

export default AvailabilityPage;