import { Navigate } from "react-router-dom";
import { getSession } from "../utils/auth";

function ProtectedRoute({ children }) {
  if (!getSession()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;