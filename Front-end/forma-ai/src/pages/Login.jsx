import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { loginUser } from "../utils/auth";
import "../components/Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const successMessage = location.state?.message;

  function onSubmit(data) {
    setLoginError("");

    const result = loginUser(data.email, data.password);

    if (!result.success) {
      setLoginError(result.message);
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-icon">F</div>
        <h2>Forma AI</h2>
      </div>

      <div className="auth-card">
        <h1>Welcome back!</h1>
        <p className="auth-subtitle">
          Log in to continue to your workspace.
        </p>

        {successMessage && (
          <div className="auth-success" role="status">
            {successMessage}
          </div>
        )}

        {loginError && (
          <div className="auth-error" role="alert">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
              })}
            />
            {errors.email && (
              <small className="field-error">
                {errors.email.message}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password", {
                  required: "Password is required.",
                })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <small className="field-error">
                {errors.password.message}
              </small>
            )}
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            Login
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;