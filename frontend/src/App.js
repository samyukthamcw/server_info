import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { jwtDecode } from "jwt-decode";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import GPU from "./pages/Gpu";
import ProtectedPage from "./components/ProtectedPage";
import { isAuthenticated, getUserRole, logout } from "./utils/auth";

// ---- AppBar Component ----
function ButtonAppBar() {
  const navigate = useNavigate();
  const role = getUserRole();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const decoded = localStorage.getItem("token")
    ? jwtDecode(localStorage.getItem("token"))
    : null;
  console.log("Decoded token:", decoded);

  return (
    <Box sx={{ flexGrow: 1, marginBottom: 2 }}>
      <AppBar position="static">
        <Toolbar>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FTTU Cluster Machine Info
          </Typography>

          {!isAuthenticated() ? (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ marginRight: 2 }}>
                Hello, <strong>{decoded.username}</strong>
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
}

// ---- ProtectedRoute ----
const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = getUserRole();
  if (!isAuthenticated()) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <h3>Access Denied 🚫</h3>;
  return children;
};

// ---- Wrapper for Background ----
function BackgroundWrapper({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <Box
      sx={{
        padding: 3,
        minHeight: "100vh",
        backgroundImage: isAuthPage ? 'url("/background.jpg")' : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </Box>
  );
}

// ---- Main App ----
export default function App() {
  return (
    <Router>
      <ButtonAppBar />
      <BackgroundWrapper>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gpu"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <GPU />
              </ProtectedRoute>
            }
          />
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <ProtectedPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BackgroundWrapper>
    </Router>
  );
}
