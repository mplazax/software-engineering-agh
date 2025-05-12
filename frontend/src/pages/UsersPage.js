import React, { useEffect, useState } from "react";
  import { Box, Typography, Button, List, ListItem, ListItemText } from "@mui/material";
  import Navbar from "../components/Navbar";
  import { apiRequest } from "../services/apiService";

  const UsersPage = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
      apiRequest("/users")
        .then((data) => {
          if (Array.isArray(data)) {
            setUsers(data);
          } else {
            console.error("Unexpected data format:", data);
          }
        })
        .catch((error) => console.error("Error fetching users:", error));
    }, []);

    return (
      <Box>
        <Navbar />
        <Box padding={2}>
          <Typography variant="h4">Zarządzaj użytkownikami</Typography>
          <List>
            {users.map((user) => (
              <ListItem key={user.id}>
                <ListItemText primary={`${user.name} - ${user.email}`} />
              </ListItem>
            ))}
          </List>
          <Button variant="contained" onClick={() => alert("Dodaj użytkownika")}>
            Dodaj użytkownika
          </Button>
        </Box>
      </Box>
    );
  };

  export default UsersPage;