import React, { useState } from "react";
import { Box, Typography, Button, TextField } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import Navbar from "../components/Navbar";

const ChangeRequestsPage = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleToday = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
  };

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      alert("Wybierz daty początku i końca!");
      return;
    }
    console.log("Wybrane daty:", {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    });
    // Możesz tutaj dodać logikę wysyłania danych do backendu
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Navbar />
        <Box padding={2}>
          <Typography variant="h4" gutterBottom>
            Wybierz daty dla zmiany
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} maxWidth={400}>
            <DatePicker
              label="Data początkowa"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
            <DatePicker
              label="Data końcowa"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
            <Box display="flex" justifyContent="space-between" gap={2}>
              <Button variant="outlined" onClick={handleToday}>
                Powrót do dzisiaj
              </Button>
              <Button variant="contained" onClick={handleSubmit}>
                Zatwierdź
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ChangeRequestsPage;