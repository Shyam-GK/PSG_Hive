import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Authentication Pages
import LoginForm from "./pages/auth/LoginForm";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Otp from "./pages/auth/otp";
import ResetPassword from "./pages/auth/ResetPassword";

// Other Pages and Components
import LandingPage from "./pages/LandingPage";
import ClubDetail from "./pages/club/clubdetails";
import AllEventsPage from "./pages/events/allevents";
import ClubRegistrationForm from "./components/ClubRegistrationForm";
import AdminDashboard from "./components/AdminDashboard";
import FacultyDashboard from "./components/FacultyDashboard";
import ClubSummary from "./components/ClubSummary";
import UsersAllotments from "./components/UsersAllotments";
import UsersNotRegistered from "./components/UsersNotRegistered";
import Navbar from "./components/Navbar";
import StudentProfile from "./studentProfile"; // Import the StudentProfile component

// Modified auth check function to use localStorage instead of cookies
const isAuthenticated = () => {
  return localStorage.getItem("isLoggedIn") === "true";
};

const getUserRole = () => {
  return localStorage.getItem("role") || "student";
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const isLoggedIn = isAuthenticated();
  const role = getUserRole();
  console.log("PrivateRoute - isLoggedIn:", isLoggedIn, "role:", role, "allowedRoles:", allowedRoles);
  
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const isLoggedIn = isAuthenticated();
  const role = getUserRole();
  
  if (isLoggedIn) {
    if (role === "faculty") return <Navigate to="/faculty/dashboard" />;
    if (role === "admin") return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/" />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/otp" element={<PublicRoute><Otp /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* General Routes (for students, faculty, admins) */}
        <Route
          path="/"
          element={<PrivateRoute allowedRoles={["student", "faculty", "admin"]}><LandingPage /></PrivateRoute>}
        />
        <Route
          path="/clubs/:club_id"
          element={<PrivateRoute allowedRoles={["student", "faculty", "admin"]}><ClubDetail /></PrivateRoute>}
        />
        <Route
          path="/all-events"
          element={<PrivateRoute allowedRoles={["student", "faculty", "admin"]}><AllEventsPage /></PrivateRoute>}
        />
        <Route
          path="/club-registration"
          element={<PrivateRoute allowedRoles={["student"]}><ClubRegistrationForm /></PrivateRoute>}
        />

        {/* Student Profile Route - Only accessible by students */}
        <Route
          path="/student-profile"
          element={<PrivateRoute allowedRoles={["student"]}><StudentProfile /></PrivateRoute>}
        />

        {/* Faculty Route */}
        <Route
          path="/faculty/dashboard"
          element={<PrivateRoute allowedRoles={["faculty"]}><FacultyDashboard /></PrivateRoute>}
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>}
        />
        <Route
          path="/admin/club-summary"
          element={<PrivateRoute allowedRoles={["admin"]}><ClubSummary /></PrivateRoute>}
        />
        <Route
          path="/admin/users-allotments"
          element={<PrivateRoute allowedRoles={["admin"]}><UsersAllotments /></PrivateRoute>}
        />
        <Route
          path="/admin/users-not-registered"
          element={<PrivateRoute allowedRoles={["admin"]}><UsersNotRegistered /></PrivateRoute>}
        />
      </Routes>
    </Router>
  );
};

export default App;