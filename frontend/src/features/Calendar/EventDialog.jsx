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
  Box,
  ListItemIcon,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ConstructionIcon from "@mui/icons-material/Construction";

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
              <ListItemIcon>
                <SchoolIcon color="secondary" />
              </ListItemIcon>
              <ListItemText primary="Kurs" secondary={event.title} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CalendarTodayIcon color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary="Data"
                secondary={event.start.toLocaleDateString("pl-PL")}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AccessTimeIcon color="secondary" />
              </ListItemIcon>
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
              <ListItemIcon>
                <MeetingRoomIcon color="secondary" />
              </ListItemIcon>
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
                  <ListItemIcon>
                    <PeopleAltIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pojemność sali"
                    secondary={room.capacity}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ConstructionIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Wyposażenie"
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {room.equipment.length > 0 ? (
                          room.equipment.map((eq) => (
                            <Chip key={eq.id} label={eq.name} size="small" />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Brak
                          </Typography>
                        )}
                      </Box>
                    }
                  />
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
        <Button
          onClick={onProposeChange}
          variant="contained"
          disabled={!event || event.isCanceled}
        >
          Zgłoś potrzebę zmiany
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
