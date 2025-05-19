import React from "react";
import Navbar from "../components/Navbar";
import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();

  const features = [
    { title: "Zgłoszenia", description: "Przeglądaj zgłoszenia zmian.", path: "/requests" },
    { title: "Dostępność", description: "Wskaż swoją dostępność.", path: "/availability" },
    { title: "Propozycje", description: "Przeglądaj propozycje terminów.", path: "/proposals" },
    { title: "Sale", description: "Przeglądaj sale.", path: "/rooms" },
    { title: "Użytkownicy", description: "Przeglądaj użytkowników.", path: "/users" },
    { title: "Grupy", description: "Przeglądaj grupy.", path: "/groups" },
    { title: "Kursy", description: "Przeglądaj kursy.", path: "/courses" },
  ];

  return (
    <Box>
      <Navbar />
      <Box padding={4}>
        <Typography variant="h4" gutterBottom>
          Witaj w systemie zarządzania zajęciami!
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{feature.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(feature.path)}>
                    Otwórz
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default MainPage;