import React, { useMemo } from "react";
import {
  Container,
  Chip,
  Box,
  Typography,
  Tooltip,
  Paper,
  Card,
  CardContent,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { apiRequest } from "../api/apiService";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ClassIcon from "@mui/icons-material/Class";
import SyncIcon from "@mui/icons-material/Sync";
import NotesIcon from "@mui/icons-material/Notes";

const statusConfig = {
  PENDING: { label: "Oczekujące", color: "warning" },
  ACCEPTED: { label: "Zaakceptowane", color: "success" },
  REJECTED: { label: "Odrzucone", color: "error" },
  CANCELLED: { label: "Anulowane", color: "default" },
};

// --- Komponent karty dla widoku mobilnego ---
const RequestCard = ({ request }) => {
  const status = statusConfig[request.status] || {
    label: request.status,
    color: "default",
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1}
        >
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 600, lineHeight: 1.3 }}
            >
              {request.course_event?.course?.name ?? "Brak nazwy kursu"}
            </Typography>
          </Box>
          <Chip label={status.label} color={status.color} size="small" />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={1.5}>
          <Box display="flex" alignItems="center">
            <PersonIcon color="action" sx={{ mr: 1.5 }} fontSize="small" />
            <Typography variant="body2">
              <strong>Zgłaszający:</strong>{" "}
              {`${request.initiator.name} ${request.initiator.surname}`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <CalendarTodayIcon
              color="action"
              sx={{ mr: 1.5 }}
              fontSize="small"
            />
            <Typography variant="body2">
              <strong>Data zgłoszenia:</strong>{" "}
              {format(new Date(request.created_at), "dd.MM.yyyy HH:mm", {
                locale: pl,
              })}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <SyncIcon color="action" sx={{ mr: 1.5 }} fontSize="small" />
            <Typography variant="body2">
              <strong>Typ:</strong>{" "}
              {request.cyclical ? "Cykliczne" : "Jednorazowe"}
            </Typography>
          </Box>
          <Box display="flex" alignItems="flex-start">
            <NotesIcon
              color="action"
              sx={{ mr: 1.5, mt: "4px" }}
              fontSize="small"
            />
            <Typography variant="body2">
              <strong>Powód:</strong> {request.reason}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const ChangeRequestsOverviewPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    data: requests = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["allChangeRequests"],
    queryFn: () => apiRequest("/change-requests/related"),
  });

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 70 },
      {
        field: "course",
        headerName: "Kurs",
        flex: 1,
        minWidth: 200,
        valueGetter: (value, row) => row.course_event?.course?.name ?? "B/D",
      },
      {
        field: "initiator",
        headerName: "Zgłaszający",
        width: 180,
        valueGetter: (value, row) =>
          `${row.initiator.name} ${row.initiator.surname}`,
      },
      {
        field: "created_at",
        headerName: "Data zgłoszenia",
        width: 160,
        renderCell: ({ value }) =>
          format(new Date(value), "dd.MM.yyyy HH:mm", { locale: pl }),
      },
      {
        field: "cyclical",
        headerName: "Typ",
        width: 100,
        renderCell: ({ value }) => (
          <Chip
            label={value ? "Cykliczne" : "Jednorazowe"}
            size="small"
            color={value ? "info" : "default"}
            variant="outlined"
          />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 150,
        renderCell: ({ value }) => (
          <Chip
            label={statusConfig[value]?.label || value}
            color={statusConfig[value]?.color || "default"}
            size="small"
          />
        ),
      },
      {
        field: "reason",
        headerName: "Powód",
        flex: 2,
        minWidth: 250,
        renderCell: (params) => (
          <Tooltip title={params.value} placement="bottom-start">
            <Typography noWrap variant="body2">
              {params.value}
            </Typography>
          </Tooltip>
        ),
      },
    ],
    []
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      );
    }
    if (isError) {
      return (
        <Alert severity="error">Błąd ładowania danych: {error.message}</Alert>
      );
    }

    if (isMobile) {
      // Widok mobilny - lista kart
      return (
        <Box sx={{ p: 2 }}>
          {requests.length > 0 ? (
            requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                Brak zgłoszeń do wyświetlenia.
              </Typography>
            </Paper>
          )}
        </Box>
      );
    } else {
      // Widok desktopowy - tabela DataGrid
      return (
        <AdminDataGrid
          columns={columns}
          rows={requests}
          isLoading={isLoading}
          isError={isError}
          error={error}
          toolbarConfig={{
            searchPlaceholder: "Szukaj po nazwie kursu, zgłaszającym...",
          }}
        />
      );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ p: { xs: 0, sm: "0 !important" } }}>
      {renderContent()}
    </Container>
  );
};

export default ChangeRequestsOverviewPage;
