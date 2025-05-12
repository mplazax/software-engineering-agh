import React from "react";
import Navbar from "../components/Navbar";
import { Box, Typography } from "@mui/material";

const MainPage = () => {
  return (
    <Box>
      <Navbar />
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography variant="h4">Witaj na stronie głównej!</Typography>
      </Box>
    </Box>
  );
};

export default MainPage;