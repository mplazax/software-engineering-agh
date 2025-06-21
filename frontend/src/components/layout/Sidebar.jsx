import React, { useContext } from "react";
import {
  Box,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext.jsx";

import DashboardIcon from "@mui/icons-material/Dashboard";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PeopleIcon from "@mui/icons-material/People";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import RecommendIcon from "@mui/icons-material/Recommend";
import BuildIcon from "@mui/icons-material/Build";
import BlockIcon from "@mui/icons-material/Block";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory"; // <-- NOWA IKONA
import { CalendarIcon } from "@mui/x-date-pickers";

const drawerWidth = 280;

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

const commonNavItems = [
  { text: "Panel główny", icon: <DashboardIcon />, path: "/" },
  { text: "Kalendarz", icon: <EventNoteIcon />, path: "/calendar" },
];

const userNavItems = [
  { text: "Rekomendacje", icon: <RecommendIcon />, path: "/recommendations" },
];

const adminNavItems = [
  {
    text: "Zgłoszenia Zmian",
    icon: <ChangeHistoryIcon />,
    path: "/change-requests-management",
  },
  { text: "Użytkownicy", icon: <PeopleIcon />, path: "/users" },
  { text: "Grupy", icon: <GroupsIcon />, path: "/groups" },
  { text: "Sale", icon: <MeetingRoomIcon />, path: "/rooms" },
  { text: "Wyposażenie", icon: <BuildIcon />, path: "/equipment" },
  { text: "Kursy", icon: <SchoolIcon />, path: "/courses" },
  { text: "Zajęcia", icon: <CalendarIcon />, path: "/events" },
  { text: "Blokady Sal", icon: <BlockIcon />, path: "/room-unavailability" },
];

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const getNavItems = () => {
    switch (user?.role) {
      case "ADMIN":
        return [...commonNavItems, ...adminNavItems];
      case "KOORDYNATOR":
        const coordinatorItems = adminNavItems.filter(
          (item) => item.path !== "/users"
        );
        return [...commonNavItems, ...coordinatorItems];
      case "PROWADZACY":
      case "STAROSTA":
        return [...commonNavItems, ...userNavItems];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const drawerContent = (
    <div>
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
          {getInitials(user?.name)}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {user?.name} {user?.surname}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {roleTranslations[user?.role] || user?.role}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: "grey.200" }} />
      <List sx={{ p: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.path === "/"}
              sx={{
                borderRadius: "6px",
                "&.active": {
                  backgroundColor: "action.selected",
                  "& .MuiListItemIcon-root, & .MuiListItemText-primary": {
                    color: "primary.main",
                    fontWeight: 600,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  color: "text.primary",
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
