import React, { useEffect, useState } from "react";
      import { Box, Typography, Button, List, ListItem, ListItemText } from "@mui/material";
      import Navbar from "../components/Navbar";
      import { apiRequest } from "../services/apiService";

      const GroupsPage = () => {
        const [groups, setGroups] = useState([]);

        useEffect(() => {
          apiRequest("/groups")
            .then((data) => {
              if (Array.isArray(data)) {
                setGroups(data);
              } else {
                console.error("Unexpected data format:", data);
              }
            })
            .catch((error) => console.error("Error fetching groups:", error));
        }, []);

        return (
          <Box>
            <Navbar />
            <Box padding={2}>
              <Typography variant="h4">Zarządzaj grupami</Typography>
              <List>
                {groups.map((group) => (
                  <ListItem key={group.id}>
                    <ListItemText primary={`${group.name} - Rok: ${group.year || "Brak danych"}`} />
                  </ListItem>
                ))}
              </List>
              <Button variant="contained" onClick={() => alert("Dodaj grupę")}>
                Dodaj grupę
              </Button>
            </Box>
          </Box>
        );
      };

      export default GroupsPage;