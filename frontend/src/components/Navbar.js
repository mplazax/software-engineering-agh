import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Container maxWidth="xl">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            System Zgłaszania Zmian w Planie Zajęć
          </Typography>
          <Box>
            <Button color="inherit" onClick={() => navigate("/main")}>
              Strona główna
            </Button>
            <Button color="inherit" onClick={() => navigate("/requests")}>
              Plan zajęć
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Wyloguj
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;