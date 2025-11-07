import { jwtDecode } from "jwt-decode";

export const getToken = () => localStorage.getItem("token");

export const getUserRole = () => {
  try {
    const token = getToken();
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.role;
  } catch (e) {
    console.error("Invalid token");
    return null;
  }
};

export const isAuthenticated = () => !!getToken();

export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};
