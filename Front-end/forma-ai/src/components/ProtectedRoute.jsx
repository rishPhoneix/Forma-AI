import { Navigate } from "react-router-dom";
import { getSession } from "../utils/auth";
import FloatingAssistant from "./FloatingAssistant";

function ProtectedRoute({ children }) {
  if (!getSession()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <FloatingAssistant />
    </>
  );
}

export default ProtectedRoute;