import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  CircularProgress,
  Alert,
  Toolbar,
  TextField,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";

const AdminDataGrid = ({
  columns,
  rows,
  isLoading,
  isError,
  error,
  onAddItem,
  toolbarConfig = {},
  // Nowy, opcjonalny prop do niestandardowego filtrowania
  customFilterFn,
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const lowerCaseSearch = searchText.toLowerCase();

    // Jeśli przekazano niestandardową funkcję filtrowania (dla Sal), użyj jej
    if (customFilterFn) {
      return customFilterFn(rows, lowerCaseSearch);
    }

    // W przeciwnym razie, użyj domyślnego, generycznego filtrowania
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lowerCaseSearch)
      )
    );
  }, [rows, searchText, customFilterFn]);

  return (
    <Paper>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder={toolbarConfig.searchPlaceholder || "Szukaj..."}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ width: { xs: "100%", sm: 350 } }}
            // Kluczowa poprawka rozwiązująca problem autouzupełniania
            autoComplete="off"
            id={`datagrid-search-${toolbarConfig.addLabel}`} // Unikalne ID
          />
        </Box>
        {onAddItem && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddItem}
          >
            {toolbarConfig.addLabel || "Dodaj"}
          </Button>
        )}
      </Toolbar>

      {isError && <Alert severity="error">Błąd: {error?.message}</Alert>}
      <Box sx={{ height: "70vh", width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{
            loadingOverlay: () => (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress />
              </Box>
            ),
          }}
        />
      </Box>
    </Paper>
  );
};

export default AdminDataGrid;
