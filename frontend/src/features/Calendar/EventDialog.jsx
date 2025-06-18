import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Typography,
  Chip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService.js";

const EventDialog = ({ event, open, onClose, onProposeChange }) => {
  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ["rooms", event?.room_id],
    queryFn: () => apiRequest(`/rooms/${event.room_id}`),
    enabled: !!event?.room_id,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Szczegóły wydarzenia</DialogTitle>
      <DialogContent dividers>
        {event ? (
          <List>
            <ListItem>
              <ListItemText primary="Kurs" secondary={event.title} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Data"
                secondary={event.start.toLocaleDateString("pl-PL")}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Godziny"
                secondary={`${event.start.toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} - ${event.end.toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Sala"
                secondary={
                  isLoadingRoom ? (
                    <CircularProgress size={20} />
                  ) : (
                    room?.name || "Brak przypisanej sali"
                  )
                }
              />
            </ListItem>
            {room && (
              <>
                <ListItem>
                  <ListItemText
                    primary="Pojemność sali"
                    secondary={room.capacity}
                  />
                </ListItem>
                <ListItem>
                  <Typography variant="subtitle2" sx={{ pl: 2, pt: 1 }}>
                    Wyposażenie
                  </Typography>
                </ListItem>
                <ListItem sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {room.equipment.length > 0 ? (
                    room.equipment.map((eq) => (
                      <Chip key={eq.id} label={eq.name} size="small" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Brak
                    </Typography>
                  )}
                </ListItem>
              </>
            )}
          </List>
        ) : (
          <CircularProgress />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zamknij</Button>
        <Button onClick={onProposeChange} variant="contained" disabled={!event}>
          Zgłoś potrzebę zmiany
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
