import React, { useMemo } from "react";
import { Container, Chip, Tooltip, Box, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService";
import AdminDataGrid from "../features/Admin/AdminDataGrid";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const statusConfig = {
  PENDING: { label: "Oczekujące", color: "warning" },
  ACCEPTED: { label: "Zaakceptowane", color: "success" },
  REJECTED: { label: "Odrzucone", color: "error" },
  CANCELLED: { label: "Anulowane", color: "default" },
};

const filterRequests = (rows, searchText) => {
  return rows.filter((row) => {
    const searchLower = searchText.toLowerCase();
    const courseName = row.course_event?.course?.name?.toLowerCase() || "";
    const initiatorName =
      `${row.initiator?.name} ${row.initiator?.surname}`.toLowerCase();
    const reason = row.reason?.toLowerCase() || "";
    const status = statusConfig[row.status]?.label.toLowerCase() || "";

    return (
      courseName.includes(searchLower) ||
      initiatorName.includes(searchLower) ||
      reason.includes(searchLower) ||
      status.includes(searchLower)
    );
  });
};

const ChangeRequestsManagementPage = () => {
  const {
    data: requests,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["all-change-requests"],
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
        // KLUCZOWA ZMIANA: Zamiast valueGetter używamy renderCell
        renderCell: (params) => {
          return params.row?.course_event?.course?.name || "Brak danych";
        },
      },
      {
        field: "initiator",
        headerName: "Zgłaszający",
        flex: 1,
        minWidth: 150,
        // KLUCZOWA ZMIANA: Zamiast valueGetter używamy renderCell
        renderCell: (params) => {
          const initiator = params.row?.initiator;
          return initiator
            ? `${initiator.name} ${initiator.surname}`
            : "Brak danych";
        },
      },
      {
        field: "created_at",
        headerName: "Data zgłoszenia",
        width: 150,
        // KLUCZOWA ZMIANA: Tutaj valueGetter może zostać, ale uprościmy go
        valueGetter: (params) =>
          params.row?.created_at ? new Date(params.row.created_at) : null,
        renderCell: (params) =>
          params.value
            ? format(params.value, "dd.MM.yyyy HH:mm", { locale: pl })
            : "",
        type: "dateTime",
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => (
          <Chip
            label={statusConfig[params.value]?.label || params.value}
            color={statusConfig[params.value]?.color || "default"}
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
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Box
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {params.value}
            </Box>
            <Tooltip title={params.value} placement="top-start">
              <IconButton size="small" sx={{ ml: "auto" }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );

  return (
    <Container maxWidth="xl" sx={{ p: "0 !important" }}>
      <AdminDataGrid
        columns={columns}
        rows={requests || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onAddItem={null}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po kursie, zgłaszającym, statusie...",
        }}
        customFilterFn={filterRequests}
      />
    </Container>
  );
};

export default ChangeRequestsManagementPage;
