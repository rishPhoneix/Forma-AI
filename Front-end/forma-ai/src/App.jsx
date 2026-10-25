
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FormBuilder from "./pages/FormBuilder";
import FormRenderer from "./pages/FormRenderer";
import Responses from "./pages/Responses";
import ActivityHistory from "./pages/ActivityHistory";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import { getSession } from "./utils/auth";

function App() {
  const isLoggedIn = Boolean(getSession());

  return (
    <Routes>
      {/* Default Route */}
      <Route
        path="/"
        element={
          <Navigate
            to={isLoggedIn ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      {/* Register Page */}
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Login Page */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Create or Edit Form */}
      <Route
        path="/create-form"
        element={
          <ProtectedRoute>
            <FormBuilder />
          </ProtectedRoute>
        }
      />

      {/* Fill and Submit Form */}
      <Route
        path="/fill-form/:id"
        element={
          <ProtectedRoute>
            <FormRenderer />
          </ProtectedRoute>
        }
      />

      {/* Submitted Responses */}
      <Route
        path="/responses"
        element={
          <ProtectedRoute>
            <Responses />
          </ProtectedRoute>
        }
      />

      {/* Activity History */}
      <Route
        path="/activity-history"
        element={
          <ProtectedRoute>
            <ActivityHistory />
          </ProtectedRoute>
        }
      />

      {/* Page Not Found */}
      <Route
        path="*"
        element={
          <Navigate
            to={isLoggedIn ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
