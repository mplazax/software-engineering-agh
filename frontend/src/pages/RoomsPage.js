import React, { useEffect, useState } from "react";
  import { Box, Typography, Button, List, ListItem, ListItemText } from "@mui/material";
  import Navbar from "../components/Navbar";
  import { apiRequest } from "../services/apiService";

  const RoomsPage = () => {
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
      apiRequest("/rooms")
        .then((data) => {
          if (Array.isArray(data)) {
            setRooms(data);
          } else {
            console.error("Unexpected data format:", data);
          }
        })
        .catch((error) => console.error("Error fetching rooms:", error));
    }, []);

    return (
      <Box>
        <Navbar />
        <Box padding={2}>
          <Typography variant="h4">Zarządzaj salami</Typography>
          <List>
            {rooms.map((room) => (
              <ListItem key={room.id}>
                <ListItemText primary={`${room.name} - ${room.capacity || "Brak danych"} miejsc`} />
              </ListItem>
            ))}
          </List>
          <Button variant="contained" onClick={() => alert("Dodaj salę")}>
            Dodaj salę
          </Button>
        </Box>
      </Box>
    );
  };

  export default RoomsPage;