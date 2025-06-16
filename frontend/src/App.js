import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { pl } from "date-fns/locale";

import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./AppRoutes";
import theme from "./theme/theme";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
