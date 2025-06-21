// Plik: ./frontend/src/components/dashboard/PendingRequestsList.jsx
import React from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Box,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const PendingRequestsList = ({ requests, isLoading }) => {
  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Ostatnie oczekujące zgłoszenia
      </Typography>
      {isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="80%"
        >
          <CircularProgress />
        </Box>
      ) : requests && requests.length > 0 ? (
        <List disablePadding>
          {requests.map((req, index) => (
            <React.Fragment key={req.id}>
              <ListItem
                secondaryAction={
                  <Button
                    component={Link}
                    to="/recommendations"
                    size="small"
                    variant="outlined"
                  >
                    Zobacz
                  </Button>
                }
              >
                <ListItemText
                  primary={req.course_event?.course?.name || "Brak kursu"}
                  secondary={`Zgłosił(a): ${req.initiator.name} ${
                    req.initiator.surname
                  } dnia ${format(new Date(req.created_at), "dd.MM.yyyy", {
                    locale: pl,
                  })}`}
                />
              </ListItem>
              {index < requests.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
          Brak oczekujących zgłoszeń.
        </Typography>
      )}
    </Paper>
  );
};

export default PendingRequestsList;
