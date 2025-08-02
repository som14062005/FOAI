import { jwtDecode } from "jwt-decode";

// Check if auth token exists
export const isAuthenticated = () => {
  const token = sessionStorage.getItem("authToken");
  return !!token;
};

// Decode and get user info from token
export const getUserFromToken = () => {
  const token = sessionStorage.getItem("authToken");
  if (!token) return null;

  try {
    return jwtDecode(token); // example: { name, role, email, etc. }
  } catch (e) {
    console.error("Invalid token:", e);
    return null;
  }
};

// Extract user role
export const getUserRole = () => {
  const user = getUserFromToken();
  return user?.role || null;
};

// Logout only this tab
export const logout = () => {
  sessionStorage.removeItem("authToken");
  window.location.href = "/";
};
