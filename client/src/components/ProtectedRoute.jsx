import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem("authToken");
  const user = JSON.parse(sessionStorage.getItem("user")); // this will now work
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin-dashboard" : "/user-dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;
