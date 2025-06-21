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
  const [hasRequestedGeneration, setHasRequestedGeneration] = useState(false);


  const { data: requests = [], isLoading: isLoadingRequests } =
    useRelatedRequests();

  const handleFilterChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRequestSelect = (id) => {
    setSelectedRequestId(id);
    setHasRequestedGeneration(false);
    setIsEditingAvailability(false);
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

  const {
    data: recommendationStatus,
    refetch: refetchRecStatus,
    isLoading: isLoadingRecStatus
  } = useQuery({
    queryKey: ["recommendationStatus", selectedProposal?.id],
    queryFn: () =>
      apiRequest(`/recommendations/${selectedProposal?.id}/acceptance-status`),
    enabled: !!selectedProposal?.id,
  });

  const { data: serverProposals = [] } = useQuery({
    queryKey: ["proposals", selectedRequestId, user.id],
    queryFn: () =>
      apiRequest(`/proposals/by-change-id/${selectedRequestId}`),
    enabled: !!selectedRequestId,
  });

  const { data: proposalStatus, refetch: refetchProposalStatus } = useQuery({
    queryKey: ["proposalStatus", selectedRequestId],
    queryFn: () =>
      apiRequest(`/change-requests/${selectedRequestId}/proposal-status`),
    enabled: !!selectedRequestId && selectedRequest?.status === "PENDING",
  });

  useEffect(() => {
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

  const generateRecommendationsMutation = useMutation({
    mutationFn: () => apiRequest(`/recommendations/${selectedRequestId}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", selectedRequestId] });
      refetchRecommendations().then(({ data }) => {
        const updated = data?.find(r => r.id === selectedProposal?.id);
        if (updated) setSelectedProposal(updated);
      });
    },
    onError: (error) => {
      showNotification(`Błąd generowania rekomendacji: ${error.message}`, "error");
    },
  });

  const {
    data: recommendations = [],
    isLoading: isLoadingRecommendations,
    refetch: refetchRecommendations,
  } = useQuery({
    queryKey: ["recommendations", selectedRequestId],
    queryFn: () => apiRequest(`/recommendations/${selectedRequestId}`),
    enabled: false,
  });

  useEffect(() => {
    if (
      selectedRequestId &&
      proposalStatus?.teacher_has_proposed &&
      proposalStatus?.leader_has_proposed &&
      !hasRequestedGeneration
    ) {
      setHasRequestedGeneration(true);
      generateRecommendationsMutation.mutate();
    }
  }, [selectedRequestId, proposalStatus, hasRequestedGeneration]);

  const replaceProposalsMutation = useMutation({
  mutationFn: async (proposalsToAdd) => {
    await apiRequest(
      `/proposals/by-user-and-change-request?user_id=${user.id}&change_request_id=${selectedRequestId}`,
      { method: "DELETE" }
    );

    const addResults = await Promise.all(
      proposalsToAdd.map((p) =>
        apiRequest("/proposals/", {
          method: "POST",
          body: JSON.stringify(p),
        })
      )
    );

    return addResults;
  },
  onSuccess: (responses) => {
    let anyRecommendationGenerated = false;

    for (const res of responses) {
      if (res?.type === "recommendations") {
        anyRecommendationGenerated = true;
        queryClient.invalidateQueries({
          queryKey: ["recommendations", selectedRequestId],
        });
        refetchRecommendations();
        showNotification("Wygenerowano rekomendacje.", "success");
        break;
      }
    }

    if (!anyRecommendationGenerated) {
      showNotification("Dostępność została zaktualizowana.", "success");
    }

    queryClient.invalidateQueries({
      queryKey: ["proposals", selectedRequestId, user.id],
    });
    refetchProposalStatus();
    setIsEditingAvailability(false);
  },
  onError: (error) =>
    showNotification(`Błąd aktualizacji: ${error.message}`, "error"),
});


  const handleSaveAvailability = (localProposalsSet) => {
    const proposalsToAdd = Array.from(localProposalsSet).map((key) => {
      const [day, timeSlotId] = key.split("_");
      return {
        change_request_id: selectedRequestId,
        day,
        time_slot_id: parseInt(timeSlotId, 10),
      };
    });

    replaceProposalsMutation.mutate(proposalsToAdd);
  };

  const acceptMutation = useMutation({
    mutationFn: (recommendationId) =>
      apiRequest(`/recommendations/${recommendationId}/accept`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["related-requests-all"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", selectedRequestId] });
      queryClient.invalidateQueries({ queryKey: ["allEventsWithDetails"] });
      refetchRecommendations();
      refetchRecStatus();
      showNotification("Zaakceptowano propozycję. Czekamy na drugą stronę.", "info");
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
    onSuccess: async () => {
      const { data } = await refetchRecommendations();
      setSelectedProposal(null);

      if (!data || data.length === 0) {
        showNotification("Propozycja została odrzucona. Brak kolejnych rekomendacji.", "warning");
      } else {
        showNotification("Propozycja została odrzucona.", "warning");
      }
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
                  {recommendations.map((rec) => {
  const acceptedByYou =
    (user.role === "PROWADZACY" && rec.accepted_by_teacher) ||
    (user.role !== "PROWADZACY" && rec.accepted_by_leader);

  const acceptedByOther =
    (user.role === "PROWADZACY" && rec.accepted_by_leader) ||
    (user.role !== "PROWADZACY" && rec.accepted_by_teacher);

  const rejectedByYou =
    (user.role === "PROWADZACY" && rec.rejected_by_teacher) ||
    (user.role !== "PROWADZACY" && rec.rejected_by_leader);

  const rejectedByOther =
    (user.role === "PROWADZACY" && rec.rejected_by_leader) ||
    (user.role !== "PROWADZACY" && rec.rejected_by_teacher);

  let statusLabel = "";
  let statusColor = "text.secondary";

  if (rec.accepted_by_teacher && rec.accepted_by_leader) {
    statusLabel = "Obie strony zaakceptowały";
    statusColor = "success.main";
  } else if (acceptedByYou) {
    statusLabel = "Zaakceptowane przez Ciebie – oczekiwanie na drugą stronę";
    statusColor = "info.main";
  } else if (rejectedByYou) {
    statusLabel = "Odrzucone przez Ciebie";
    statusColor = "error.main";
  } else if (rejectedByOther) {
    statusLabel = "Odrzucone przez drugą stronę";
    statusColor = "warning.main";
  } else if (acceptedByOther) {
  statusLabel = "Zaakceptowane przez drugą stronę – oczekiwanie na Ciebie";
  statusColor = "info.main";
  } else {
    statusLabel = "Niezaakceptowane";
    statusColor = "text.secondary";
  }

  return (
    <ListItemButton
      key={rec.id}
      onClick={() => setSelectedProposal(rec)}
      sx={{
        alignItems: "flex-start",
        flexDirection: "column",
        gap: 0.5,
        opacity: rec.rejected_by_teacher || rec.rejected_by_leader ? 0.6 : 1,
      }}
    >
      <ListItemText
        primary={`Data: ${format(
          new Date(rec.recommended_day),
          "EEEE, dd.MM.yyyy",
          { locale: pl }
        )}`}
        secondary={`Slot: ${timeSlotMap[rec.recommended_slot_id]} / Sala: ${rec.recommended_room?.name}`}
      />
      <Typography variant="caption" color={statusColor}>
        {statusLabel}
      </Typography>
    </ListItemButton>
  );
})}
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
              acceptMutation.mutate(selectedProposal.id)
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