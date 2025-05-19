// frontend/src/pages/SelectTermPage.js
import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, Button } from "@mui/material";
import { apiRequest } from "../services/apiService";

const SelectTermPage = ({ changeRequestId }) => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    apiRequest(`/change_recommendation/${changeRequestId}/recommendations`)
      .then((data) => setRecommendations(data))
      .catch((error) => console.error("Błąd podczas pobierania rekomendacji:", error));
  }, [changeRequestId]);

  const handleSelect = (recommendationId) => {
    alert(`Wybrano termin: ${recommendationId}`);
  };

  return (
    <Box>
      <Typography variant="h4">Wybierz Termin</Typography>
      <List>
        {recommendations.map((rec) => (
          <ListItem key={rec.id}>
            {`Od: ${rec.recommended_start_datetime}, Do: ${rec.recommended_end_datetime}`}
            <Button onClick={() => handleSelect(rec.id)}>Wybierz</Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SelectTermPage;