import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService";
import { format } from "date-fns";

const timeSlotMap = {
  1: "08:00-09:30",
  2: "09:45-11:15",
  3: "11:30-13:00",
  4: "13:15-14:45",
  5: "15:00-16:30",
  6: "16:45-18:15",
  7: "18:30-20:00",
};

const AvailabilitySelector = ({ changeRequestId, onProposalChange }) => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: proposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ["proposals", changeRequestId],
    queryFn: () =>
      apiRequest(`/proposals?change_request_id=${changeRequestId}`),
    enabled: !!changeRequestId,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proposals", changeRequestId],
      });
      if (onProposalChange) {
        onProposalChange();
      }
    },
  };

  const createMutation = useMutation({
    mutationFn: (newProposal) =>
      apiRequest("/proposals/", {
        method: "POST",
        body: JSON.stringify(newProposal),
      }),
    ...mutationOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: (proposalId) =>
      apiRequest(`/proposals/${proposalId}`, { method: "DELETE" }),
    ...mutationOptions,
  });

  const handleSlotClick = (slotId) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const existingProposal = proposals.find(
      (p) =>
        format(new Date(p.day), "yyyy-MM-dd") === formattedDate &&
        p.time_slot_id === slotId
    );

    if (existingProposal) {
      deleteMutation.mutate(existingProposal.id);
    } else {
      createMutation.mutate({
        change_request_id: changeRequestId,
        day: formattedDate,
        time_slot_id: slotId,
      });
    }
  };

  return (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">Zaproponuj swoją dostępność</Typography>
      <DatePicker
        label="Wybierz dzień"
        value={selectedDate}
        onChange={(newValue) => setSelectedDate(newValue)}
        disablePast
      />

      {isLoadingProposals ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={1}>
          {Object.entries(timeSlotMap).map(([id, time]) => {
            const slotId = parseInt(id, 10);
            const formattedDate = format(selectedDate, "yyyy-MM-dd");
            const isProposed = proposals.some(
              (p) =>
                format(new Date(p.day), "yyyy-MM-dd") === formattedDate &&
                p.time_slot_id === slotId
            );
            const isMutating =
              (createMutation.isPending &&
                createMutation.variables?.time_slot_id === slotId) ||
              (deleteMutation.isPending &&
                proposals.find((p) => p.id === deleteMutation.variables)
                  ?.time_slot_id === slotId);

            return (
              <Grid item xs={6} sm={4} key={id}>
                <Chip
                  label={time}
                  clickable
                  onClick={() => handleSlotClick(slotId)}
                  color={isProposed ? "success" : "default"}
                  variant={isProposed ? "filled" : "outlined"}
                  sx={{ width: "100%", fontWeight: 600 }}
                  disabled={isMutating}
                  icon={isMutating ? <CircularProgress size={16} /> : null}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      {createMutation.isError && (
        <Alert severity="error">{createMutation.error.message}</Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error">{deleteMutation.error.message}</Alert>
      )}
    </Paper>
  );
};

export default AvailabilitySelector;
