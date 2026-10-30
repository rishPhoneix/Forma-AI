
import { Navigate } from "react-router-dom";
import { getSession } from "../utils/auth";

function PublicRoute({ children }) {
  if (getSession()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;
