import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Button,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/apiService.js";
import {
  format,
  startOfWeek,
  addDays,
  subDays,
  isPast,
  isToday,
} from "date-fns";
import { pl } from "date-fns/locale";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const timeSlotMap = {
  1: "08:00-09:30",
  2: "09:45-11:15",
  3: "11:30-13:00",
  4: "13:15-14:45",
  5: "15:00-16:30",
  6: "16:45-18:15",
  7: "18:30-20:00",
};

const AvailabilitySelector = ({
  changeRequestId,
  onSave,
  isEditing,
  onCancelEdit,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localProposals, setLocalProposals] = useState(new Set());

  const { data: serverProposals = [], isLoading: isLoadingServerProposals } =
    useQuery({
      queryKey: ["proposals", changeRequestId],
      queryFn: () =>
        apiRequest(`/proposals?change_request_id=${changeRequestId}`),
      enabled: !!changeRequestId,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    const newSet = new Set(
        serverProposals.map((p) => `${p.day}_${p.time_slot_id}`)
    );

    const areEqual =
        localProposals.size === newSet.size &&
        [...newSet].every((item) => localProposals.has(item));

    if (!areEqual) {
      setLocalProposals(newSet);
    }
  }, [serverProposals]);

  const handleSlotClick = (day, slotId) => {
    if (!isEditing) return;
    const key = `${format(day, "yyyy-MM-dd")}_${slotId}`;
    
    setLocalProposals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const weekStartsOn = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStartsOn, i)
  );

  if (isLoadingServerProposals) {
    return <CircularProgress sx={{ display: "block", margin: "auto" }} />;
  }

  return (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <IconButton onClick={() => setCurrentDate(subDays(currentDate, 7))}>
          <ArrowBackIosNewIcon />
        </IconButton>
        <Typography variant="h6" textAlign="center">
          {format(weekStartsOn, "dd MMMM yyyy", { locale: pl })} -{" "}
          {format(addDays(weekStartsOn, 6), "dd MMMM yyyy", { locale: pl })}
        </Typography>
        <IconButton onClick={() => setCurrentDate(addDays(currentDate, 7))}>
          <ArrowForwardIosIcon />
        </IconButton>
      </Stack>

      <Grid container spacing={1}>
        {weekDays.map((day) => {
          const dayIsPast = isPast(day) && !isToday(day);
          return (
            <Grid item xs={12} sm={6} md={12 / 7} key={day.toISOString()}>
              <Paper
                sx={{
                  p: 1,
                  bgcolor: dayIsPast
                    ? "grey.100"
                    : isEditing
                    ? "transparent"
                    : "grey.50",
                  border: isToday(day) ? "2px solid" : "none",
                  borderColor: "primary.main",
                  height: "100%",
                }}
              >
                <Typography
                  variant="subtitle2"
                  align="center"
                  fontWeight="bold"
                >
                  {format(day, "EEEE", { locale: pl })}
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  color="text.secondary"
                  mb={1}
                >
                  {format(day, "dd.MM", { locale: pl })}
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(timeSlotMap).map(([id, time]) => {
                    const slotId = parseInt(id, 10);
                    const key = `${format(day, "yyyy-MM-dd")}_${slotId}`;
                    const isSelected = localProposals.has(key);

                    return (
                      <Chip
                        key={id}
                        label={time}
                        clickable={isEditing && !dayIsPast}
                        onClick={() => handleSlotClick(day, slotId)}
                        color={isSelected ? "success" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        disabled={dayIsPast}
                        sx={{
                          width: "100%",
                          fontWeight: 500,
                          cursor: isEditing ? "pointer" : "default",
                          "&:hover": {
                            bgcolor: isEditing
                              ? isSelected
                                ? ""
                                : "action.hover"
                              : "",
                          },
                        }}
                      />
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {isEditing && (
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={2}
          sx={{ mt: 2 }}
        >
          <Button onClick={onCancelEdit}>Anuluj</Button>
          <Button variant="contained" onClick={() => onSave(localProposals)}>
            Zatwierdź Dostępność
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default AvailabilitySelector;
