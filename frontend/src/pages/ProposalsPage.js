import React, { useEffect, useState } from "react";
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";

const ProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ change_request_id: "", user_id: "", start_date: "", end_date: "" });

  useEffect(() => {
    apiRequest("/proposals")
      .then((data) => setProposals(data))
      .catch((error) => console.error("Error fetching proposals:", error));
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    apiRequest("/proposals", {
      method: "POST",
      body: JSON.stringify({
        change_request_id: formData.change_request_id,
        user_id: formData.user_id,
        interval: {
          start_date: formData.start_date,
          end_date: formData.end_date,
        },
      }),
    })
      .then((newProposal) => {
        setProposals((prev) => [...prev, newProposal]);
        handleClose();
      })
      .catch((error) => console.error("Error adding proposal:", error));
  };

  return (
    <Box>
      <Navbar />
      <Box padding={2}>
        <Typography variant="h4">Zarządzaj propozycjami</Typography>
        <List>
          {proposals.map((proposal) => (
            <ListItem key={proposal.id}>
              <ListItemText
                primary={`Propozycja ID: ${proposal.id}, Użytkownik: ${proposal.user_id}`}
                secondary={`Od: ${proposal.available_start_datetime}, Do: ${proposal.available_end_datetime}`}
              />
            </ListItem>
          ))}
        </List>
        <Button variant="contained" onClick={handleOpen}>
          Dodaj propozycję
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Dodaj propozycję</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="ID zgłoszenia zmiany"
            name="change_request_id"
            fullWidth
            value={formData.change_request_id}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="ID użytkownika"
            name="user_id"
            fullWidth
            value={formData.user_id}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Data początkowa"
            name="start_date"
            type="datetime-local"
            fullWidth
            value={formData.start_date}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Data końcowa"
            name="end_date"
            type="datetime-local"
            fullWidth
            value={formData.end_date}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Anuluj</Button>
          <Button onClick={handleSubmit} variant="contained">
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalsPage;