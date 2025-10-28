import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthenticationUI from "./pages/AuthenticationUI";
import AdminDashboardUI from "./pages/AdminDashboardUI";
import UserDashboardUI from "./pages/UserDashboardUI";
import ProtectedRoute from "./components/ProtectedRoute";
import UserQuizUI from './pages/UserQuiz';
import TripResultPage from './pages/TripResultPage';
import SavedTripsPage from './pages/recent';
import LiveMapPage from './pages/LiveMapPage';


function App() {
  return (
    <Router>
      <Routes>
        {/* Default route - Authentication */}
        <Route path="/" element={<AuthenticationUI />} />
        
        {/* Protected User Dashboard */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute>
              <UserDashboardUI />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardUI />
            </ProtectedRoute>
          }
        />
        <Route path="/userquiz" element={<UserQuizUI />} />
        <Route path="/result" element={<TripResultPage />} />
        <Route path="/recent" element={<SavedTripsPage />} />
        <Route path="/live-map/:tripId" element={<LiveMapPage />} />
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
