import React, { useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  ListItemIcon,
  Badge,
} from "@mui/material";
import { useNavigate, NavLink } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import SchoolIcon from "@mui/icons-material/School";
import Logout from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";

// Funkcja pomocnicza do inicjałów
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length > 1 && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const roleTranslations = {
  ADMIN: "Administrator",
  KOORDYNATOR: "Koordynator",
  PROWADZACY: "Prowadzący",
  STAROSTA: "Starosta",
};

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogoutClick = () => {
    handleClose();
    logout();
    navigate("/login");
  };

  const navLinkStyle = {
    color: "inherit",
    textDecoration: "none",
    padding: "6px 8px",
    borderRadius: "4px",
    "&.active": {
      backgroundColor: "rgba(0, 0, 0, 0.08)",
    },
  };

  return (
    <AppBar position="fixed" color="default">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2, color: "primary.main", fontSize: 32 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: "pointer", fontWeight: 700 }}
          onClick={() => navigate("/")}
        >
          System Rezerwacji Sal
        </Typography>

        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          <Button component={NavLink} to="/" sx={navLinkStyle}>
            Dashboard
          </Button>
          <Button component={NavLink} to="/calendar" sx={navLinkStyle}>
            Kalendarz
          </Button>
          {["PROWADZACY", "STAROSTA"].includes(user?.role) && (
            <Button component={NavLink} to="/recommendations" sx={navLinkStyle}>
              Rekomendacje
            </Button>
          )}
        </Box>

        <Box
          sx={{
            flexGrow: 0,
            ml: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Tooltip title="Powiadomienia">
            <IconButton color="inherit">
              <Badge color="error" variant="dot" invisible={true}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Opcje użytkownika">
            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: "primary.main" }}>
                {getInitials(user?.name)}
              </Avatar>
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
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
              <Typography variant="subtitle1" noWrap>
                {user?.name} {user?.surname}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {roleTranslations[user?.role] || user?.role}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogoutClick}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Wyloguj
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
