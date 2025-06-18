import React, { useContext } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext.jsx";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Logout from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const getPageTitle = (pathname) => {
  const titles = {
    "/": "Panel główny",
    "/calendar": "Kalendarz",
    "/recommendations": "Rekomendacje i Propozycje",
    "/users": "Użytkownicy",
    "/groups": "Grupy",
    "/rooms": "Sale",
    "/courses": "Kursy",
    "/events": "Zajęcia"
  };
  return titles[pathname] || "System Rezerwacji Sal";
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogoutClick = () => {
    handleClose();
    logout();
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        p: 2,
        mb: 2,
        backgroundColor: "background.default",
        borderBottom: "1px solid #E2E8F0",
      }}
    >
      <Typography variant="h5" component="h1" fontWeight={700}>
        {getPageTitle(location.pathname)}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title="Powiadomienia">
          <IconButton color="inherit">
            <Badge color="error" variant="dot" invisible={true}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Opcje użytkownika">
          <IconButton onClick={handleMenu} sx={{ p: 0 }}>
            <AccountCircleIcon sx={{ color: "text.secondary" }} />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.15))",
              mt: 1.5,
              minWidth: 180,
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleLogoutClick}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Wyloguj
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;
