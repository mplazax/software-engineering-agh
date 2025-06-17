import React, { createContext, useState, useCallback, useContext } from "react";
import { Snackbar, Alert } from "@mui/material";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, severity = "success") => {
    setNotification({ message, severity, key: new Date().getTime() });
  }, []);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification(null);
  };

  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notification && (
        <Snackbar
          key={notification.key}
          open={!!notification}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleClose}
            severity={notification.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
