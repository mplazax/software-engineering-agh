import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1E293B" },
    secondary: { main: "#64748B" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#1E293B", secondary: "#64748B" },
    success: { main: "#10B981", light: "#E8F5E9", dark: "#1B5E20" },
    warning: { main: "#F59E0B" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: "#1E293B" },
    h5: { fontWeight: 600, color: "#1E293B" },
    h6: { fontWeight: 600, color: "#334155" },
    subtitle1: { color: "#334155" },
    subtitle2: { color: "#64748B" },
    body1: { color: "#334155" },
    body2: { color: "#64748B" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: "10px 22px" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow:
            "0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.06)",
          backgroundImage: "none",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { border: "none" },
        cell: { borderBottom: "1px solid #F1F5F9" },
        columnHeaders: {
          backgroundColor: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#1E293B",
          boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#334155",
          color: "#FFFFFF",
        },
      },
    },
  },
});

export default theme;
