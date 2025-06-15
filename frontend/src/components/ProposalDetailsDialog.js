// components/ProposalDetailsDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const formatSlotTime = (slotId) => {
  const slots = [
    "08:00 - 09:30",
    "09:45 - 11:15",
    "11:30 - 13:00",
    "13:15 - 14:45",
    "15:00 - 16:30",
    "16:45 - 18:15",
    "18:30 - 20:00",
  ];
  return slots[slotId - 1] || `Slot ${slotId}`;
};

const ProposalDetailsDialog = ({
  open,
  onClose,
  proposal,
  roomNames,
  userRole,
  onStatusChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Szczegóły propozycji</DialogTitle>
      <DialogContent>
        {proposal && (
          <List>
            <ListItem>
              <ListItemText primary="Data" secondary={proposal.recommended_day} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Slot"
                secondary={formatSlotTime(proposal.recommended_slot_id)}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Sala"
                secondary={roomNames[proposal.recommended_room_id] || proposal.recommended_room_id}
              />
            </ListItem>
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zamknij</Button>
        {["STAROSTA", "PROWADZACY"].includes(userRole) && (
          <>
            <Button
              onClick={() => onStatusChange(false)}
              color="error"
              variant="outlined"
            >
              Odrzuć
            </Button>
            <Button
              onClick={() => onStatusChange(true)}
              color="primary"
              variant="contained"
            >
              Zaakceptuj
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProposalDetailsDialog;