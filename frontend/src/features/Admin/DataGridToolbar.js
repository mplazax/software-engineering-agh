import React from "react";
import { Box, Toolbar, TextField, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const DataGridToolbar = ({
  searchText,
  onSearchTextChange,
  onAddItem,
  searchPlaceholder,
  addLabel,
}) => {
  return (
    <Toolbar>
      <Box sx={{ flexGrow: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder={searchPlaceholder || "Szukaj..."}
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          sx={{ width: { xs: "100%", sm: 350 } }}
          // OSTATECZNA POPRAWKA: Wyłączamy autouzupełnianie przeglądarki
          autoComplete="off"
          // Można też dodać unikalne ID, aby dodatkowo zdezorientować przeglądarkę
          id={`datagrid-search-${searchPlaceholder}`}
        />
      </Box>
      {onAddItem && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddItem}>
          {addLabel || "Dodaj"}
        </Button>
      )}
    </Toolbar>
  );
};

export default DataGridToolbar;
