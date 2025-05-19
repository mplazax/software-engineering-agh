// frontend/src/pages/RequestStatusPage.js
import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem } from "@mui/material";
import { apiRequest } from "../services/apiService";

const RequestStatusPage = ({ userId }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    apiRequest(`/change_requests/my?initiator_id=${userId}`)
      .then((data) => setRequests(data))
      .catch((error) => console.error("Błąd podczas pobierania statusu zgłoszeń:", error));
  }, [userId]);

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