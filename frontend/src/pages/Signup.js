import React, { useState } from "react";
import {
  Avatar,
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Paper,
  MenuItem,
  Link,
  IconButton,
  InputAdornment,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import AppBarHeader from "../components/AppBarHeader";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8092/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email, role }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registration successful! Please log in.");
      navigate("/login");
    } else {
      alert(data.error || "Registration failed");
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
      }}
    >
      <AppBarHeader />
      <Paper
        elevation={8}
        sx={{
          mt: 2,
          p: 3,
          width: "320px",          // ✅ reduced width
          maxWidth: "90%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 2,
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main", width: 40, height: 40 }}>
          <LockOutlinedIcon fontSize="small" />
        </Avatar>
        <Typography component="h1" variant="h6" sx={{ mb: 1 }}>
          Sign Up
        </Typography>

        <Box component="form" onSubmit={handleSignup} sx={{ width: "100%" }}>
          <TextField
            size="small"
            margin="dense"
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            size="small"
            margin="dense"
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            size="small"
            margin="dense"
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            margin="dense"
            fullWidth
            select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 1, py: 1, fontSize: "0.9rem", borderRadius: 2 }}
          >
            Sign Up
          </Button>

          <Link
            href="/login"
            variant="body2"
            display="block"
            textAlign="center"
            sx={{ fontSize: "0.85rem" }}
          >
            Already have an account? Log in
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}
