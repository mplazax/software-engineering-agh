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
import { AuthContext } from "../../contexts/AuthContext";

import DashboardIcon from "@mui/icons-material/Dashboard";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PeopleIcon from "@mui/icons-material/People";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import RecommendIcon from "@mui/icons-material/Recommend";

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
  { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { text: "Kalendarz", icon: <EventNoteIcon />, path: "/calendar" },
  { text: "Rekomendacje", icon: <RecommendIcon />, path: "/recommendations" },
];

const adminNavItems = [
  { text: "Użytkownicy", icon: <PeopleIcon />, path: "/users" },
  { text: "Grupy", icon: <GroupsIcon />, path: "/groups" },
  { text: "Sale", icon: <MeetingRoomIcon />, path: "/rooms" },
  { text: "Kursy", icon: <SchoolIcon />, path: "/courses" },
];

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const getNavItems = () => {
    switch (user?.role) {
      case "ADMIN":
        return [...commonNavItems, ...adminNavItems];
      case "KOORDYNATOR":
        return [...commonNavItems, ...adminNavItems.slice(1)];
      case "PROWADZACY":
      case "STAROSTA":
        return commonNavItems;
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
              end={item.path === "/"} // Important for root path matching
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
