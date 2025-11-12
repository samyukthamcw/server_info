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

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import GPU from "./pages/Gpu";
import ProtectedPage from "./components/ProtectedPage";
import { isAuthenticated, getUserRole, logout } from "./utils/auth";


// ---- ProtectedRoute ----
const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = getUserRole();
  if (!isAuthenticated()) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <h3>Access Denied 🚫</h3>;
  return children;
};

// ---- Wrapper for Background ----
function BackgroundWrapper({ children }) {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/" || location.pathname === "/signup";

  React.useEffect(() => {
    if (isAuthPage) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [isAuthPage]);

  return (
    <Box
      sx={{
        position: "fixed",           // ✅ anchor to full viewport
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh",            // ✅ fills screen correctly
        backgroundImage: isAuthPage ? 'url("/background.jpg")' : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        margin: 0,
        padding: 0,
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
      <BackgroundWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
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
