import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { registerUser } from "../utils/auth";
import "../components/Auth.css";

function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  function onSubmit(data) {
    setServerError("");

    const result = registerUser(data);

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    navigate("/login", {
      replace: true,
      state: {
        message: "Registration successful! Please log in.",
      },
    });
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-icon">F</div>
        <h2>Forma AI</h2>
      </div>

      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Get started with intelligent, AI-powered forms.
        </p>

        {serverError && (
          <div className="auth-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              {...register("name", {
                required: "Full name is required.",
                validate: (value) =>
                  value.trim().length >= 2 ||
                  "Name must contain at least 2 characters.",
              })}
            />
            {errors.name && (
              <small className="field-error">
                {errors.name.message}
              </small>
            )}
          </div>

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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                {...register("password", {
                  required: "Password is required.",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters.",
                  },
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (value) =>
                  value === password || "Passwords do not match.",
              })}
            />
            {errors.confirmPassword && (
              <small className="field-error">
                {errors.confirmPassword.message}
              </small>
            )}
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            Create Account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;