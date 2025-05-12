import React from "react";
import Navbar from "../components/Navbar";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Navbar />
      <Box display="flex" flexDirection="column" alignItems="center" minHeight="80vh" gap={2}>
        <Typography variant="h4">Witaj na stronie głównej!</Typography>
        <Button variant="contained" onClick={() => navigate("/rooms")}>
          Zarządzaj salami
        </Button>
        <Button variant="contained" onClick={() => navigate("/users")}>
          Zarządzaj użytkownikami
        </Button>
        <Button variant="contained" onClick={() => navigate("/groups")}>
          Zarządzaj grupami
        </Button>
        <Button variant="contained" onClick={() => navigate("/courses")}>
          Zarządzaj kursami
        </Button>
      </Box>
    </Box>
  );
};

export default MainPage;