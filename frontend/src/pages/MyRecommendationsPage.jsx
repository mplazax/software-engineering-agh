import React, { useState, useMemo, useContext, useEffect } from "react";
import {
  Typography,
  Paper,
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
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemButton,
  Stack,
  Avatar,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import EditIcon from "@mui/icons-material/Edit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService.js";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { useNotification } from "../contexts/NotificationContext.jsx";
import AvailabilitySelector from "../features/Proposals/AvailabilitySelector.jsx";

const statusConfig = {
  PENDING: { label: "Oczekujące", color: "warning" },
  ACCEPTED: { label: "Zaakceptowane", color: "success" },
  REJECTED: { label: "Odrzucone", color: "error" },
  CANCELLED: { label: "Anulowane", color: "default" },
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

const useRelatedRequests = () => {
  return useQuery({
    queryKey: ["related-requests-all"],
    queryFn: () => apiRequest(`/change-requests/related?limit=1000`),
  });
};

const MyRecommendationsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();

  const [filters, setFilters] = useState({ status: "PENDING", search: "" });
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);

  const { data: requests = [], isLoading: isLoadingRequests } =
    useRelatedRequests();

  const handleFilterChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRequestSelect = (id) => {
    setSelectedRequestId(id);
    setIsEditingAvailability(false); // Zawsze resetuj do trybu podglądu przy zmianie
  };

  const getRequestDisplayLabel = (req) => {
    const courseName = req.course_event?.course?.name || "Nieznany kurs";
    const eventDate = req.course_event?.day
      ? format(new Date(req.course_event.day), "dd.MM.yyyy", { locale: pl })
      : "Brak daty";
    return `${courseName} (z dnia ${eventDate})`;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const statusMatch = filters.status ? req.status === filters.status : true;
      const searchMatch = filters.search
        ? getRequestDisplayLabel(req)
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          req.reason.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      return statusMatch && searchMatch;
    });
  }, [requests, filters]);

  const selectedRequest = useMemo(() => {
    return requests.find((req) => req.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  const { data: serverProposals = [] } = useQuery({
    queryKey: ["proposals", selectedRequestId, user.id],
    queryFn: () =>
      apiRequest(`/proposals?change_request_id=${selectedRequestId}`),
    enabled: !!selectedRequestId,
  });

  const { data: proposalStatus, refetch: refetchProposalStatus } = useQuery({
    queryKey: ["proposalStatus", selectedRequestId],
    queryFn: () =>
      apiRequest(`/change-requests/${selectedRequestId}/proposal-status`),
    enabled: !!selectedRequestId && selectedRequest?.status === "PENDING",
  });

  useEffect(() => {
    // Jeśli nie ma propozycji od bieżącego użytkownika, automatycznie przejdź w tryb edycji
    if (selectedRequest && proposalStatus) {
      const isCurrentUserTeacher = user.role === "PROWADZACY";
      const currentUserHasProposed =
        (isCurrentUserTeacher && proposalStatus.teacher_has_proposed) ||
        (!isCurrentUserTeacher && proposalStatus.leader_has_proposed);
      if (!currentUserHasProposed) {
        setIsEditingAvailability(true);
      }
    }
  }, [selectedRequest, proposalStatus, user.role]);

  const { data: recommendations = [], isLoading: isLoadingRecommendations } =
    useQuery({
      queryKey: ["recommendations", selectedRequestId],
      queryFn: () => apiRequest(`/recommendations/${selectedRequestId}`),
      enabled:
        !!selectedRequestId &&
        proposalStatus?.teacher_has_proposed &&
        proposalStatus?.leader_has_proposed,
    });

  const updateProposalsMutation = useMutation({
    mutationFn: async ({ toAdd, toDelete }) => {
      const addPromises = toAdd.map((p) =>
        apiRequest("/proposals/", { method: "POST", body: JSON.stringify(p) })
      );
      const deletePromises = toDelete.map((p) =>
        apiRequest(`/proposals/${p.id}`, { method: "DELETE" })
      );
      return Promise.all([...addPromises, ...deletePromises]);
    },
    onSuccess: () => {
      showNotification("Dostępność została zaktualizowana.", "success");
      queryClient.invalidateQueries({
        queryKey: ["proposals", selectedRequestId, user.id],
      });
      refetchProposalStatus(); // Kluczowe odświeżenie statusu
      setIsEditingAvailability(false);
    },
    onError: (error) =>
      showNotification(`Błąd aktualizacji: ${error.message}`, "error"),
  });

  const handleSaveAvailability = (localProposalsSet) => {
    const serverSet = new Set(
      serverProposals.map((p) => `${p.day}_${p.time_slot_id}`)
    );
    const localArray = Array.from(localProposalsSet);

    const toAdd = localArray
      .filter((key) => !serverSet.has(key))
      .map((key) => ({
        change_request_id: selectedRequestId,
        day: key.split("_")[0],
        time_slot_id: parseInt(key.split("_")[1], 10),
      }));

    const toDelete = serverProposals.filter(
      (p) => !localProposalsSet.has(`${p.day}_${p.time_slot_id}`)
    );

    if (toAdd.length === 0 && toDelete.length === 0) {
      setIsEditingAvailability(false);
      return;
    }
    updateProposalsMutation.mutate({ toAdd, toDelete });
  };

  const acceptMutation = useMutation({
    mutationFn: (proposalId) =>
      apiRequest(`/recommendations/${proposalId}/accept`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["related-requests-all"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      showNotification("Termin został pomyślnie zaakceptowany.", "success");
      setSelectedProposal(null);
      setSelectedRequestId(null);
    },
    onError: (error) =>
      showNotification(`Błąd akceptacji: ${error.message}`, "error"),
  });

  const rejectMutation = useMutation({
    mutationFn: (changeRequestId) =>
      apiRequest(`/change-requests/${changeRequestId}/reject`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["related-requests-all"] });
      showNotification("Zgłoszenie zostało odrzucone.", "warning");
      setSelectedProposal(null);
      setSelectedRequestId(null);
    },
    onError: (error) =>
      showNotification(`Błąd odrzucenia: ${error.message}`, "error"),
  });

  const rejectSingleMutation = useMutation({
    mutationFn: (recommendationId) =>
      apiRequest(`/recommendations/${recommendationId}/reject`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", selectedRequestId] });
      showNotification("Propozycja została odrzucona.", "warning");
      setSelectedProposal(null);
    },
    onError: (error) =>
      showNotification(`Błąd odrzucenia propozycji: ${error.message}`, "error"),
  });

  const renderDetailsContent = () => {
    if (!selectedRequest)
      return (
        <Paper
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Typography color="text.secondary">
            Wybierz zgłoszenie z listy.
          </Typography>
        </Paper>
      );

    if (isEditingAvailability) {
      return (
          <AvailabilitySelector
              changeRequestId={selectedRequestId}
              isEditing={true}
              onSave={handleSaveAvailability}
              onCancelEdit={() => setIsEditingAvailability(false)}
          />
      );
    }


    if (selectedRequest.status !== "PENDING")
      return (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Szczegóły
          </Typography>
          <Alert
            severity={statusConfig[selectedRequest.status]?.color || "info"}
          >
            To zgłoszenie zostało już przetworzone (status:{" "}
            {statusConfig[selectedRequest.status]?.label}).
          </Alert>
        </Paper>
      );
    if (isLoadingRequests || !proposalStatus) return <CircularProgress />;

    const { teacher_has_proposed, leader_has_proposed } = proposalStatus;

    if (teacher_has_proposed && leader_has_proposed) {
      return (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Rekomendowane Terminy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Wybierz jeden z terminów pasujących obu stronom, aby go zaakceptować.
            </Typography>
            {isLoadingRecommendations ? (
                <CircularProgress />
            ) : recommendations.length === 0 ? (
                <Stack spacing={2}>
                  <Alert severity="warning">
                    Brak dostępnych sal dla wspólnych terminów. Możesz edytować swoją
                    dostępność, by spróbować ponownie.
                  </Alert>
                  <Button
                      variant="outlined"
                      onClick={() => {
                        console.log("Kliknięto: Edytuj swoją dostępność", {
                          userId: user?.id,
                          selectedRequestId,
                          timestamp: new Date().toISOString(),
                        });
                        setIsEditingAvailability(true);
                      }}
                  >
                    Edytuj swoją dostępność
                  </Button>
                </Stack>
            ) : (
                <List>
                  {recommendations.map((rec) => (
                      <ListItemButton
                          key={rec.id}
                          onClick={() => setSelectedProposal(rec)}
                      >
                        <ListItemText
                            primary={`Data: ${format(
                                new Date(rec.recommended_day),
                                "EEEE, dd.MM.yyyy",
                                { locale: pl }
                            )}`}
                            secondary={`Slot: ${
                                timeSlotMap[rec.recommended_slot_id]
                            } / Sala: ${rec.recommended_room?.name}`}
                        />
                      </ListItemButton>
                  ))}
                </List>
            )}
          </Paper>
      );
    }

    const isCurrentUserTeacher = user.role === "PROWADZACY";
    const currentUserHasProposed =
      (isCurrentUserTeacher && teacher_has_proposed) ||
      (!isCurrentUserTeacher && leader_has_proposed);

    if (currentUserHasProposed) {
      const waitingForUser = isCurrentUserTeacher
        ? selectedRequest.course_event.course.group.leader
        : selectedRequest.course_event.course.teacher;
      return (
        <Paper sx={{ p: 3 }}>
          <Alert
            severity="info"
            icon={<HourglassTopIcon />}
            sx={{ alignItems: "center" }}
          >
            <Typography fontWeight="bold" variant="h6">
              Oczekiwanie na drugą stronę
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
              Twoja dostępność została zapisana. Oczekujemy na propozycje od:
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Avatar>
                {waitingForUser.name[0]}
                {waitingForUser.surname[0]}
              </Avatar>
              <Box>
                <Typography fontWeight="500">
                  {waitingForUser.name} {waitingForUser.surname}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {waitingForUser.email}
                </Typography>
              </Box>
            </Box>
          </Alert>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setIsEditingAvailability(true)}
            sx={{ mt: 2 }}
          >
            Edytuj swoją dostępność
          </Button>
        </Paper>
      );
    }

    // Ten widok powinien być teraz rzadkością, ale jest jako fallback
    return <CircularProgress />;
  };

  return (
    <Grid container spacing={3} sx={{ height: "calc(100vh - 120px)" }}>
      <Grid
        item
        xs={12}
        md={4}
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filtruj zgłoszenia
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Szukaj po kursie lub powodzie"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Wszystkie</MenuItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>
        <Paper sx={{ flex: 1, overflow: "auto" }}>
          {isLoadingRequests ? (
            <CircularProgress sx={{ m: 4 }} />
          ) : (
            <List disablePadding>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <React.Fragment key={req.id}>
                    <ListItemButton
                      selected={selectedRequestId === req.id}
                      onClick={() => handleRequestSelect(req.id)}
                    >
                      <ListItemText
                        primary={getRequestDisplayLabel(req)}
                        secondary={req.reason}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                      <Chip
                        label={statusConfig[req.status]?.label}
                        color={statusConfig[req.status]?.color}
                        size="small"
                        sx={{ ml: 1, flexShrink: 0 }}
                      />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                ))
              ) : (
                <Typography sx={{ p: 2 }} color="text.secondary">
                  Brak zgłoszeń.
                </Typography>
              )}
            </List>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={8} sx={{ height: "100%" }}>
        {renderDetailsContent()}
      </Grid>

      <Dialog
        open={!!selectedProposal}
        onClose={() => setSelectedProposal(null)}
      >
        <DialogTitle>Potwierdź wybór terminu</DialogTitle>
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
                  primary="Godziny"
                  secondary={timeSlotMap[selectedProposal.recommended_slot_id]}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Sala"
                  secondary={`${selectedProposal.recommended_room?.name} (Pojemność: ${selectedProposal.recommended_room?.capacity})`}
                />
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProposal(null)}>Anuluj</Button>
          <Button
            onClick={() =>
              rejectMutation.mutate(selectedProposal.change_request_id)
            }
            color="error"
            variant="outlined"
            disabled={rejectMutation.isPending || acceptMutation.isPending}
          >
            Odrzuć zgłoszenie
          </Button>
          <Button
            onClick={() =>
              rejectSingleMutation.mutate(selectedProposal.id)
            }
          >
            Odrzuć propozycję
          </Button>
          <Button
            onClick={() =>
              acceptMutation.mutate(selectedProposal.source_proposal_id)
            }
            color="primary"
            variant="contained"
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          >
            {acceptMutation.isPending ? "Akceptowanie..." : "Zaakceptuj"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default MyRecommendationsPage;