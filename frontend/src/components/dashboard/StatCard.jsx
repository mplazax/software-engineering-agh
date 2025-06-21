import React from "react";
import { Paper, Typography, Box, Avatar } from "@mui/material";

const StatCard = ({ title, value, icon, color = "primary.main" }) => {
  return (
    <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
      <Box>
        <Typography variant="h6" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Paper>
  );
};

export default StatCard;
