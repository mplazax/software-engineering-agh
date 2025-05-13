import React from "react";
      import { AppBar, Toolbar, Button, Box } from "@mui/material";
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
              <Button color="inherit" onClick={() => navigate("/main")}>
                Wróć do strony głównej
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button color="inherit" onClick={handleLogout}>
                Wyloguj
              </Button>
            </Toolbar>
          </AppBar>
        );
      };

      export default Navbar;