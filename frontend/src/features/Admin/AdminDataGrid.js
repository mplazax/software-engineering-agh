import React, { useState } from "react";
import {
  Box,
  Paper,
  Toolbar,
  TextField,
  Button,
  CircularProgress,
  Alert,
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
  toolbarConfig,
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredRows = rows.filter((row) => {
    if (!searchText) return true;
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    );
  });

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
          />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddItem}>
          {toolbarConfig.addLabel || "Dodaj"}
        </Button>
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
