import React, { useState, useMemo, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AuthContext } from "../contexts/AuthContext";
import AvailabilitySelector from "../features/Proposals/AvailabilitySelector";

const statusLabels = {
  PENDING: "Oczekujące",
  ACCEPTED: "Zaakceptowane",
  REJECTED: "Odrzucone",
  CANCELLED: "Anulowane",
};

const timeSlotMap = {
  1: "08:00-09:30",
  2: "09:45-11:15",
  3: "11:30-13:00",
  4: "13:15-14:45",
  5: "15:00-16:30",
  6: "16:45-18:15",
  7: "18:30-20:00",
};

const useRelatedRequests = (status) => {
  return useQuery({
    queryKey: ["related-requests", { status }],
    queryFn: () => {
      const params = new URLSearchParams({ limit: 1000 });
      if (status) params.append("status", status);
      return apiRequest(`/change-requests/related?${params.toString()}`);
    },
    select: (data) =>
      data.map((req) => ({
        ...req,
        course_event: req.course_event || {},
      })),
  });
};

const useCoursesMap = () => {
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiRequest("/courses"),
  });
  return useMemo(() => new Map(courses.map((c) => [c.id, c.name])), [courses]);
};

const MyRecommendationsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedProposal, setSelectedProposal] = useState(null);

  const { data: requests = [], isLoading: isLoadingRequests } =
    useRelatedRequests(selectedStatus);
  const coursesMap = useCoursesMap();

  const selectedRequest = useMemo(() => {
    return requests.find((req) => req.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  const { data: recommendations = [], isLoading: isLoadingRecommendations } =
    useQuery({
      queryKey: ["recommendations", selectedRequestId],
      queryFn: () => apiRequest(`/recommendations/${selectedRequestId}`),
      enabled: !!selectedRequestId,
    });

  const acceptMutation = useMutation({
    mutationFn: (proposalId) =>
      apiRequest(`/proposals/${proposalId}/accept`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["related-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["recommendations", selectedRequestId],
      });
      setSelectedProposal(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (proposalId) =>
      apiRequest(`/proposals/${proposalId}/reject`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["related-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["recommendations", selectedRequestId],
      });
      setSelectedProposal(null);
    },
  });

  const getRequestDisplayLabel = (req) => {
    const courseName =
      coursesMap.get(req.course_event?.course_id) || "Nieznany kurs";
    const eventDate = req.course_event?.day
      ? format(new Date(req.course_event.day), "dd.MM.yyyy", { locale: pl })
      : "Brak daty";
    return `${courseName} z dnia ${eventDate} - ${req.reason}`;
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status zgłoszenia</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Status zgłoszenia"
              >
                <MenuItem value="">Wszystkie</MenuItem>
                {Object.entries(statusLabels).map(([val, lab]) => (
                  <MenuItem key={val} value={val}>
                    {lab}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Wybierz zgłoszenie</InputLabel>
              <Select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                label="Wybierz zgłoszenie"
                disabled={isLoadingRequests}
              >
                {requests.map((req) => (
                  <MenuItem key={req.id} value={req.id}>
                    {getRequestDisplayLabel(req)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {selectedRequest && selectedRequest.status === "PENDING" && (
            <AvailabilitySelector changeRequestId={selectedRequestId} />
          )}
          {selectedRequestId && selectedRequest?.status !== "PENDING" && (
            <Alert severity="info">
              To zgłoszenie zostało już przetworzone (
              {statusLabels[selectedRequest.status]}). Nie możesz już proponować
              terminów.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Rekomendowane Terminy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Poniżej znajdują się terminy pasujące obu stronom.
            </Typography>
            {isLoadingRecommendations && <CircularProgress />}
            {!isLoadingRecommendations &&
              selectedRequestId &&
              recommendations.length === 0 && (
                <Alert severity="info">
                  Brak wspólnych terminów. Upewnij się, że obie strony wskazały
                  swoją dostępność.
                </Alert>
              )}
            {recommendations.length > 0 && (
              <List>
                {recommendations.map((rec) => (
                  <React.Fragment key={rec.id}>
                    <ListItem button onClick={() => setSelectedProposal(rec)}>
                      <ListItemText
                        primary={`Data: ${format(
                          new Date(rec.recommended_day),
                          "EEEE, dd.MM.yyyy",
                          { locale: pl }
                        )}`}
                        secondary={
                          <>{`Slot: ${
                            timeSlotMap[rec.recommended_slot_id]
                          } / Sala: ${rec.recommended_room?.name}`}</>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={!!selectedProposal}
        onClose={() => setSelectedProposal(null)}
      >
        <DialogTitle>Szczegóły propozycji</DialogTitle>
        <DialogContent>
          {selectedProposal && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Data"
                  secondary={format(
                    new Date(selectedProposal.recommended_day),
                    "EEEE, dd.MM.yyyy",
                    { locale: pl }
                  )}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Slot"
                  secondary={timeSlotMap[selectedProposal.recommended_slot_id]}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Sala"
                  secondary={selectedProposal.recommended_room?.name}
                />
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProposal(null)}>Anuluj</Button>
          <Button
            onClick={() =>
              rejectMutation.mutate(selectedProposal.source_proposal_id)
            }
            color="error"
            variant="outlined"
            disabled={rejectMutation.isPending}
          >
            Odrzuć
          </Button>
          <Button
            onClick={() =>
              acceptMutation.mutate(selectedProposal.source_proposal_id)
            }
            color="primary"
            variant="contained"
            disabled={acceptMutation.isPending}
          >
            Zaakceptuj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyRecommendationsPage;
