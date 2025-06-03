import React, { useState, useContext } from "react";
import { UserContext } from "../App";
import { getCurrentUser, login } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography, Alert } from "@mui/material";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            const user = await getCurrentUser();
            setUser(user);
            navigate("/main");
        } catch (err) {
            setError("Nieprawidłowe dane logowania");
        }
    };

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
            bgcolor: "white",
            width: 300,
          }}
        >
          <Typography variant="h5" mb={2} textAlign="center">
            Logowanie
          </Typography>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Hasło"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Zaloguj
          </Button>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
      </Box>
    );
};

export default LoginPage;