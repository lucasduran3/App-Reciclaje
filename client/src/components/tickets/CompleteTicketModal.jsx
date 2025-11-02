/**
 * CompleteTicketModal - Modal para completar un ticket
 * client/src/components/tickets/CompleteTicketModal.jsx
 */

import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Button from "../common/Button";

export default function CompleteTicketModal({
  isOpen,
  onClose,
  onComplete,
  ticketId,
}) {
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cleaningStatus, setCleaningStatus] = useState("complete");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validar tipo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Tipo de archivo no permitido. Usa JPG, PNG o WebP");
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("La imagen excede el tamaño máximo de 5MB");
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setPhoto(file);
    setError("");
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!photo) {
      setError("Debes subir una foto para completar el ticket");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onComplete(photo, cleaningStatus);
      // El componente padre maneja el cierre y la actualización
    } catch (err) {
      setError(err.message || "Error al completar el ticket");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Icon icon="fluent-color:checkmark-circle-48" width="24" />
            Completar Ticket
          </h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
            disabled={loading}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
            disabled={loading}
          />

          {/* Instrucciones */}
          <div
            style={{
              padding: "var(--spacing-md)",
              background: "var(--primary-light)",
              borderRadius: "var(--radius)",
              marginBottom: "var(--spacing-lg)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
            }}
          >
            <Icon icon="fluent-color:info-24" width="20" />
            <span
              style={{ fontSize: "0.875rem", color: "var(--primary-dark)" }}
            >
              Sube una foto mostrando el área limpia y selecciona el estado de
              la limpieza
            </span>
          </div>

          {/* Upload de foto */}
          {!photoPreview ? (
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "var(--spacing-sm)",
                  fontWeight: 600,
                }}
              >
                Foto "Después" *
              </label>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "var(--spacing-2xl)",
                  border: "2px dashed var(--border)",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg)",
                  gap: "var(--spacing-md)",
                }}
              >
                <Icon
                  icon="fluent-color:camera-24"
                  width="48"
                  style={{ opacity: 0.7 }}
                />
                <p
                  style={{
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    fontSize: "0.875rem",
                  }}
                >
                  Toma una foto del área limpia
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "var(--spacing-md)",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCameraClick}
                    disabled={loading}
                    icon={<Icon icon="fluent:camera-24-filled" />}
                  >
                    Tomar Foto
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBrowseClick}
                    disabled={loading}
                    icon={<Icon icon="fluent:folder-open-24-filled" />}
                  >
                    Elegir Archivo
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "var(--spacing-sm)",
                  fontWeight: 600,
                }}
              >
                Foto "Después"
              </label>

              <div style={{ position: "relative" }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    borderRadius: "var(--radius)",
                    marginBottom: "var(--spacing-sm)",
                  }}
                />

                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  onClick={handleRemovePhoto}
                  disabled={loading}
                  icon={<Icon icon="fluent:delete-24-filled" />}
                  style={{
                    position: "absolute",
                    top: "var(--spacing-sm)",
                    right: "var(--spacing-sm)",
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          )}

          {/* Estado de limpieza */}
          <div style={{ marginBottom: "var(--spacing-lg)" }}>
            <label
              style={{
                display: "block",
                marginBottom: "var(--spacing-sm)",
                fontWeight: 600,
              }}
            >
              Estado de la Limpieza *
            </label>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-sm)",
              }}
            >
              <button
                type="button"
                onClick={() => setCleaningStatus("complete")}
                disabled={loading}
                style={{
                  padding: "var(--spacing-md)",
                  border: `2px solid ${
                    cleaningStatus === "complete"
                      ? "var(--success)"
                      : "var(--border)"
                  }`,
                  borderRadius: "var(--radius)",
                  background:
                    cleaningStatus === "complete"
                      ? "var(--success-light)"
                      : "var(--surface)",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "var(--transition)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                }}
              >
                <Icon
                  icon="fluent-color:checkmark-circle-48"
                  width="24"
                  style={{ color: "var(--success)" }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Completa</div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    El área fue limpiada completamente
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCleaningStatus("partial")}
                disabled={loading}
                style={{
                  padding: "var(--spacing-md)",
                  border: `2px solid ${
                    cleaningStatus === "partial"
                      ? "var(--warning)"
                      : "var(--border)"
                  }`,
                  borderRadius: "var(--radius)",
                  background:
                    cleaningStatus === "partial"
                      ? "var(--warning-light)"
                      : "var(--surface)",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "var(--transition)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                }}
              >
                <Icon
                  icon="fluent-color:warning-24"
                  width="24"
                  style={{ color: "var(--warning)" }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Parcial</div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Se limpió parte del área, queda trabajo pendiente
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "var(--spacing-md)",
                background: "var(--danger-light)",
                color: "var(--danger-dark)",
                borderRadius: "var(--radius)",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
              }}
            >
              <Icon icon="fluent:error-circle-24-filled" width="20" />
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!photo || loading}
            loading={loading}
            icon={<Icon icon="fluent-color:checkmark-circle-48" />}
          >
            {loading ? "Completando..." : "Completar Ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
}
