import React, { useContext, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";


const MainPage = () => {
  const navigate = useNavigate();

  const { user } = useContext(UserContext);
  console.log("Aktualny użytkownik:", user);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);


  const features = [
    { title: "Plan zajęć", description: "Przeglądaj twój plan zajęć i zgłaszaj potrzebę zmiany.", path: "/requests", allowedRole: ["ADMIN", "KOORDYNATOR", "PROWADZACY", "STAROSTA"] },
    { title: "Propozycje", description: "Przeglądaj propozycje terminów.", path: "/proposals", allowedRole: ["ADMIN", "KOORDYNATOR", "PROWADZACY", "STAROSTA"] },
    { title: "Sale", description: "Przeglądaj sale.", path: "/rooms", allowedRole: ["ADMIN", "KOORDYNATOR"] },
    { title: "Użytkownicy", description: "Przeglądaj użytkowników.", path: "/users", allowedRole: ["ADMIN"] },
    { title: "Grupy", description: "Przeglądaj grupy.", path: "/groups", allowedRole: ["ADMIN", "KOORDYNATOR"] },
    { title: "Kursy", description: "Przeglądaj kursy.", path: "/courses", allowedRole: ["ADMIN", "KOORDYNATOR", "PROWADZACY"] },
  ];


  const visibleFeatures = features.filter(
    (feature) => user && feature.allowedRole.includes(user.role)
  );


  return (
    <Box>
      <Navbar />
      <Box padding={4}>
        <Typography variant="h4" gutterBottom>
          Witaj!
        </Typography>
        <Grid container spacing={3}>
          {visibleFeatures.map((feature) => (
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