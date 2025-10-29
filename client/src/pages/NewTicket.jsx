/**
 * New Ticket Page - Complete Form with Location & Photo
 * client/src/pages/NewTicket.jsx
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../context/AuthContext";
import ticketService from "../services/ticketService";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import LocationInput from "../components/tickets/LocationInput";
import PhotoUpload from "../components/tickets/PhotoUpload";

const ZONES = ["Centro", "Norte", "Sur", "Este", "Oeste"];
const TYPES = [
  { value: "general", label: "General", icon: "fluent-emoji-flat:wastebasket" },
  {
    value: "recyclable",
    label: "Reciclable",
    icon: "fluent-emoji-flat:recycling-symbol",
  },
  {
    value: "organic",
    label: "Orgánico",
    icon: "fluent-emoji-flat:leafy-green",
  },
  {
    value: "electronic",
    label: "Electrónico",
    icon: "fluent-emoji-flat:electric-plug",
  },
  {
    value: "hazardous",
    label: "Peligroso",
    icon: "fluent-emoji-flat:biohazard",
  },
  { value: "bulky", label: "Voluminoso", icon: "fluent-emoji-flat:package" },
];
const PRIORITIES = [
  { value: "low", label: "Baja", color: "var(--info)" },
  { value: "medium", label: "Media", color: "var(--warning)" },
  { value: "high", label: "Alta", color: "var(--danger)" },
  { value: "urgent", label: "Urgente", color: "var(--danger)" },
];
const SIZES = [
  { value: "small", label: "Pequeño", desc: "Cabe en una bolsa" },
  { value: "medium", label: "Mediano", desc: "Varios objetos" },
  { value: "large", label: "Grande", desc: "Muchos objetos" },
  { value: "xlarge", label: "Muy grande", desc: "Requiere varios viajes" },
];

export default function NewTicket() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    zone: "",
    type: "",
    priority: "medium",
    estimated_size: "medium",
    address: "",
    location: null, // { lat, lng }
    photo: null, // File o base64
  });

  // Validación en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "title":
        if (!value || value.length < 5) {
          newErrors.title = "El título debe tener al menos 5 caracteres";
        } else if (value.length > 120) {
          newErrors.title = "El título no puede exceder 120 caracteres";
        } else {
          delete newErrors.title;
        }
        break;

      case "description":
        if (!value || value.length < 10) {
          newErrors.description =
            "La descripción debe tener al menos 10 caracteres";
        } else if (value.length > 2000) {
          newErrors.description =
            "La descripción no puede exceder 2000 caracteres";
        } else {
          delete newErrors.description;
        }
        break;

      case "zone":
        if (!value) {
          newErrors.zone = "Selecciona una zona";
        } else {
          delete newErrors.zone;
        }
        break;

      case "type":
        if (!value) {
          newErrors.type = "Selecciona un tipo de residuo";
        } else {
          delete newErrors.type;
        }
        break;

      case "address":
        if (!value || value.length < 5) {
          newErrors.address = "La dirección debe tener al menos 5 caracteres";
        } else {
          delete newErrors.address;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    setSubmitError("");
  };

  const handleLocationChange = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      location: locationData.coords,
      address: locationData.address || prev.address,
    }));

    if (locationData.coords) {
      const newErrors = { ...errors };
      delete newErrors.location;
      setErrors(newErrors);
    }

    setSubmitError("");
  };

  const handlePhotoChange = (photo) => {
    setFormData((prev) => ({ ...prev, photo }));

    if (photo) {
      const newErrors = { ...errors };
      delete newErrors.photo;
      setErrors(newErrors);
    }

    setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (
      !formData.title ||
      formData.title.length < 5 ||
      formData.title.length > 120
    ) {
      newErrors.title = "El título debe tener entre 5 y 120 caracteres";
    }

    if (
      !formData.description ||
      formData.description.length < 10 ||
      formData.description.length > 2000
    ) {
      newErrors.description =
        "La descripción debe tener entre 10 y 2000 caracteres";
    }

    if (!formData.zone) {
      newErrors.zone = "Selecciona una zona";
    }

    if (!formData.type) {
      newErrors.type = "Selecciona un tipo de residuo";
    }

    if (!formData.address || formData.address.length < 5) {
      newErrors.address = "Ingresa una dirección válida";
    }

    if (!formData.location) {
      newErrors.location = "Selecciona una ubicación";
    }

    if (!formData.photo) {
      newErrors.photo = "Sube una foto del lugar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitError("Por favor completa todos los campos requeridos");
      return;
    }

    if (!currentUser) {
      setSubmitError("Debes iniciar sesión para crear un ticket");
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        zone: formData.zone,
        type: formData.type,
        priority: formData.priority,
        estimated_size: formData.estimated_size,
        address: formData.address.trim(),
        location: formData.location,
      };

      const response = await ticketService.createWithPhoto(
        ticketData,
        formData.photo
      );

      // Navegar al ticket creado
      navigate(`/tickets/${response.data.id}`, {
        state: { message: "¡Ticket creado exitosamente! +50 puntos 🎉" },
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      setSubmitError(
        error.message || "Error al crear el ticket. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.title &&
      formData.description &&
      formData.zone &&
      formData.type &&
      formData.address &&
      formData.location &&
      formData.photo &&
      Object.keys(errors).length === 0
    );
  };

  if (!currentUser) {
    return (
      <div className="page">
        <Card>
          <div style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
            <Icon
              icon="fluent:lock-closed-24-filled"
              width={64}
              style={{
                color: "var(--text-muted)",
                marginBottom: "var(--spacing-lg)",
              }}
            />
            <h2>Inicia sesión para reportar</h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              Necesitas tener una cuenta para crear tickets
            </p>
            <Button variant="primary" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page new-ticket-page">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        icon={<Icon icon="fluent:arrow-left-24-filled" width="20" />}
        style={{ marginBottom: "var(--spacing-lg)" }}
      >
        Volver
      </Button>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Icon
              icon="fluent-color:megaphone-loud-32"
              width="40"
              style={{ verticalAlign: "middle" }}
            />{" "}
            Reportar Punto Sucio
          </h1>
          <p className="page-subtitle">
            Ayuda a mantener limpia tu ciudad reportando puntos que necesiten
            limpieza
          </p>
        </div>
        <Badge variant="warning" icon={<Icon icon="fluent-color:star-48" />}>
          +50 puntos
        </Badge>
      </div>

      {submitError && (
        <Card
          style={{
            background: "var(--danger-light)",
            borderLeft: "4px solid var(--danger)",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              color: "var(--danger-dark)",
            }}
          >
            <Icon icon="fluent:error-circle-24-filled" width="24" />
            <span>{submitError}</span>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="new-ticket-grid">
          {/* Columna Izquierda - Información Básica */}
          <div className="new-ticket-main">
            {/* Título */}
            <Card>
              <h3 className="card-title">Información Básica</h3>

              <div className="form-group">
                <label className="form-label">
                  Título del reporte *
                  <span className="char-count">
                    {formData.title.length}/120
                  </span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => handleChange(e.target)}
                  placeholder="Ej: Basura acumulada en la esquina"
                  maxLength={120}
                  className={errors.title ? "input-error" : ""}
                />
                {errors.title && (
                  <span className="error-message">{errors.title}</span>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label className="form-label">
                  Descripción detallada *
                  <span className="char-count">
                    {formData.description.length}/2000
                  </span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleChange(e.target)}
                  placeholder="Describe el problema: tipo de basura, cantidad aproximada, tiempo que lleva ahí..."
                  rows={5}
                  maxLength={2000}
                  className={errors.description ? "input-error" : ""}
                />
                {errors.description && (
                  <span className="error-message">{errors.description}</span>
                )}
              </div>

              {/* Zona y Tipo */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Zona *</label>
                  <select
                    name="zone"
                    value={formData.zone}
                    onChange={(e) => handleChange(e.target)}
                    className={errors.zone ? "input-error" : ""}
                  >
                    <option value="">Seleccionar...</option>
                    {ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                  {errors.zone && (
                    <span className="error-message">{errors.zone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de residuo *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e) => handleChange(e.target)}
                    className={errors.type ? "input-error" : ""}
                  >
                    <option value="">Seleccionar...</option>
                    {TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <span className="error-message">{errors.type}</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Ubicación */}
            <Card>
              <h3 className="card-title">
                <Icon icon="fluent-color:location-24" width="24" /> Ubicación
              </h3>
              <LocationInput
                onLocationChange={handleLocationChange}
                error={errors.location}
              />
            </Card>

            {/* Foto */}
            <Card>
              <h3 className="card-title">
                <Icon icon="fluent-color:camera-24" width="24" /> Fotografía
              </h3>
              <PhotoUpload
                onPhotoChange={handlePhotoChange}
                error={errors.photo}
              />
            </Card>
          </div>

          {/* Columna Derecha - Detalles Adicionales */}
          <div className="new-ticket-sidebar">
            {/* Prioridad */}
            <Card>
              <h3 className="card-title">Prioridad</h3>
              <div className="priority-selector">
                {PRIORITIES.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    className={`priority-option ${
                      formData.priority === priority.value ? "selected" : ""
                    }`}
                    onClick={() =>
                      handleChange({ name: "priority", value: priority.value })
                    }
                    style={{
                      borderColor:
                        formData.priority === priority.value
                          ? priority.color
                          : "var(--border)",
                    }}
                  >
                    <Icon
                      icon="fluent:flag-24-filled"
                      width="20"
                      style={{ color: priority.color }}
                    />
                    <span>{priority.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Tamaño Estimado */}
            <Card>
              <h3 className="card-title">Tamaño Estimado</h3>
              <div className="size-selector">
                {SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    className={`size-option ${
                      formData.estimated_size === size.value ? "selected" : ""
                    }`}
                    onClick={() =>
                      handleChange({
                        name: "estimated_size",
                        value: size.value,
                      })
                    }
                  >
                    <strong>{size.label}</strong>
                    <span className="size-desc">{size.desc}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Consejos */}
            <Card style={{ background: "var(--primary-light)" }}>
              <h4 style={{ marginBottom: "var(--spacing-md)" }}>
                <Icon icon="fluent-color:lightbulb-48" width="24" /> Consejos
              </h4>
              <ul
                style={{
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  paddingLeft: "var(--spacing-lg)",
                }}
              >
                <li>Sé específico en la descripción</li>
                <li>Toma fotos claras del problema</li>
                <li>Indica referencias cercanas</li>
                <li>Marca la ubicación exacta en el mapa</li>
              </ul>
            </Card>

            {/* Botón de Envío */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="large"
              disabled={!isFormValid() || loading}
              loading={loading}
              icon={<Icon icon="fluent-color:send-24" />}
            >
              {loading ? "Creando ticket..." : "Crear Ticket"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
