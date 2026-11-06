import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { getSession } from "./utils/auth";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyForms = lazy(() => import("./pages/MyForms"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));
const FormRenderer = lazy(() => import("./pages/FormRenderer"));
const Responses = lazy(() => import("./pages/Responses"));
const ActivityHistory = lazy(() => import("./pages/ActivityHistory"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Templates = lazy(() => import("./pages/Templates"));

function App() {
  const isLoggedIn = Boolean(getSession());

  return (
    <Suspense fallback={<div role="status">Loading page...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={isLoggedIn ? "/dashboard" : "/login"}
              replace
            />
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-forms"
          element={
            <ProtectedRoute>
              <MyForms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-form"
          element={
            <ProtectedRoute>
              <FormBuilder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fill-form/:id"
          element={
            <ProtectedRoute>
              <FormRenderer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/responses"
          element={
            <ProtectedRoute>
              <Responses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity-history"
          element={
            <ProtectedRoute>
              <ActivityHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <Assistant />
            </ProtectedRoute>
          }
        />

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
    </Suspense>
  );
}

export default App;