/**
 * Página de Login con Supabase Auth
 */

import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Email es requerido";
    }

    if (!formData.password) {
      newErrors.password = "Contraseña es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await login(formData.identifier, formData.password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrors({
        general:
          error.message ||
          "Credenciales inválidas. Verifica tu email y contraseña.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.identifier.trim() && formData.password;
  };

  return (
    <div
      className="page"
      style={{
        maxWidth: "500px",
        margin: "4rem auto",
        padding: "0 var(--spacing-lg)",
      }}
    >
      <Card>
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "var(--spacing-md)",
            }}
          >
            <Icon icon="fluent-color:leaf-three-24" width="80" />
          </div>
          <h1
            className="page-title"
            style={{ marginBottom: "var(--spacing-sm)" }}
          >
            Eco-Game
          </h1>
          <p className="page-subtitle">Inicia sesión en tu cuenta</p>
        </div>

        {errors.general && (
          <div
            style={{
              padding: "var(--spacing-md)",
              background: "var(--danger-light)",
              color: "var(--danger-dark)",
              borderRadius: "var(--radius)",
              marginBottom: "var(--spacing-lg)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
            }}
          >
            <Icon icon="fluent:error-circle-24-filled" width="20" />
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "var(--spacing-md)" }}>
            <label
              style={{
                display: "block",
                marginBottom: "var(--spacing-sm)",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="tu@email.com"
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "var(--spacing-md)",
                  paddingLeft: "3rem",
                  border: `1px solid ${
                    errors.identifier ? "var(--danger)" : "var(--border)"
                  }`,
                  borderRadius: "var(--radius)",
                  fontSize: "1rem",
                }}
              />
              <Icon
                icon="fluent:mail-24-filled"
                width="20"
                style={{
                  position: "absolute",
                  left: "var(--spacing-md)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
            </div>
            {errors.identifier && (
              <span
                style={{
                  color: "var(--danger)",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                  display: "block",
                }}
              >
                {errors.identifier}
              </span>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "var(--spacing-md)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-sm)",
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Contraseña
              </label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--primary)",
                  textDecoration: "none",
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "var(--spacing-md)",
                  paddingLeft: "3rem",
                  paddingRight: "3rem",
                  border: `1px solid ${
                    errors.password ? "var(--danger)" : "var(--border)"
                  }`,
                  borderRadius: "var(--radius)",
                  fontSize: "1rem",
                }}
              />
              <Icon
                icon="fluent:lock-closed-24-filled"
                width="20"
                style={{
                  position: "absolute",
                  left: "var(--spacing-md)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "var(--spacing-md)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <Icon
                  icon={
                    showPassword
                      ? "fluent:eye-off-24-filled"
                      : "fluent:eye-24-filled"
                  }
                  width="20"
                />
              </button>
            </div>
            {errors.password && (
              <span
                style={{
                  color: "var(--danger)",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                  display: "block",
                }}
              >
                {errors.password}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="large"
            disabled={!isFormValid() || loading}
            loading={loading}
            style={{ marginTop: "var(--spacing-lg)" }}
          >
            Iniciar Sesión
          </Button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "var(--spacing-xl) 0",
              gap: "var(--spacing-md)",
            }}
          >
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              o
            </span>
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
          </div>

          {/* Register Link */}
          <div
            style={{
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              style={{
                color: "var(--primary)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Crear Cuenta
            </Link>
          </div>
        </form>
      </Card>

      {/* Info Footer */}
      <div
        style={{
          marginTop: "var(--spacing-xl)",
          padding: "var(--spacing-lg)",
          background: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          textAlign: "center",
        }}
      >
        <Icon
          icon="fluent-color:shield-checkmark-24"
          width="32"
          style={{ marginBottom: "var(--spacing-sm)" }}
        />
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          Tu información está protegida y segura
        </p>
      </div>
    </div>
  );
}
