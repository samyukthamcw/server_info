import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { isAuthenticated, logout, getUserRole } from "../utils/auth";

const AppBarHeader = () => {
  const navigate = useNavigate();
  const role = getUserRole();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const decoded = localStorage.getItem("token")
    ? jwtDecode(localStorage.getItem("token"))
    : null;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#04325cff",
          zIndex: (theme) => theme.zIndex.drawer + 1, 
        }}
      >
        <Toolbar>
          {/* Logo/Icon */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/favicon_1.ico`}
              alt="menu icon"
              style={{ width: 24, height: 24 }}
            />
          </IconButton>

          {/* Title */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FCTU Cluster Machine Info
          </Typography>

          {/* Conditional Buttons */}
          {!isAuthenticated() ? (
            <Button color="inherit" component={Link} to="/">
              Login
            </Button>
          ) : (
            <>
              <Typography variant="body1" sx={{ marginRight: 2 }}>
                Hello, <strong>{decoded?.username}</strong>
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default AppBarHeader;
