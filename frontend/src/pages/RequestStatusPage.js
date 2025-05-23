// frontend/src/pages/RequestStatusPage.js
import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem } from "@mui/material";
import { apiRequest } from "../services/apiService";
import {useNavigate} from "react-router-dom";

const RequestStatusPage = ({ userId }) => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

    // Sprawdzenie czy użytkownik jest zalogowany (np. po tokenie w localStorage)
  useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
          navigate("/login", { replace: true });
      }
      apiRequest(`/change_requests/my?initiator_id=${userId}`)
          .then((data) => setRequests(data))
          .catch((error) => console.error("Błąd podczas pobierania statusu zgłoszeń:", error));
    }, [navigate, userId]);


  return (
    <Box>
      <Typography variant="h4">Status Zgłoszeń</Typography>
      <List>
        {requests.map((req) => (
          <ListItem key={req.id}>
            {`Zgłoszenie ID: ${req.id}, Status: ${req.status}`}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RequestStatusPage;