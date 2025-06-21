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
  customFilterFn,
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const lowerCaseSearch = searchText.toLowerCase();

    if (customFilterFn) {
      return customFilterFn(rows, lowerCaseSearch);
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lowerCaseSearch)
      )
    );
  }, [rows, searchText, customFilterFn]);

  const CustomToolbar = () => (
    <Toolbar>
      <Box sx={{ flexGrow: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder={toolbarConfig.searchPlaceholder || "Szukaj..."}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: { xs: "100%", sm: 350 } }}
          autoComplete="off"
          id={`datagrid-search-${toolbarConfig.addLabel}`}
        />
      </Box>
      {onAddItem && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddItem}>
          {toolbarConfig.addLabel || "Dodaj"}
        </Button>
      )}
    </Toolbar>
  );

  return (
    <Paper>
      {isError && (
        <Alert severity="error" sx={{ m: 2, mb: 0 }}>
          Błąd: {error?.message}
        </Alert>
      )}
      <Box sx={{ height: "75vh", width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
          pageSizeOptions={[15, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 15,
              },
            },
          }}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{
            toolbar: CustomToolbar,
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
            noRowsOverlay: () => (
              <Box sx={{ p: 4, textAlign: "center" }}>Brak danych</Box>
            ),
          }}
          sx={{ border: 0 }}
        />
      </Box>
    </Paper>
  );
};

export default AdminDataGrid;
