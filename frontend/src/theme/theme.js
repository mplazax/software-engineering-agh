import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1E5E3A" },
    secondary: { main: "#424242" },
    background: { default: "#f4f6f8", paper: "#ffffff" },
    text: { primary: "#171717", secondary: "#5f6c7a" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: "#171717" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#171717",
          boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8, padding: "10px 22px" } },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)",
          backgroundImage: "none",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { border: "none" },
        cell: { borderBottom: "1px solid #f0f0f0" },
        columnHeaders: {
          backgroundColor: "#f4f6f8",
          borderBottom: "1px solid #e0e0e0",
        },
      },
    },
  },
});

export default theme;
