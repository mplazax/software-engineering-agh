import React from "react";
    import { AppBar, Toolbar, Button, Typography } from "@mui/material";
    import { useNavigate } from "react-router-dom";
    import { logout } from "../services/authService";

    const Navbar = () => {
      const navigate = useNavigate();

      const handleLogout = () => {
        logout();
        navigate("/login");
      };

      return (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Aplikacja
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Wyloguj
            </Button>
          </Toolbar>
        </AppBar>
      );
    };

    export default Navbar;