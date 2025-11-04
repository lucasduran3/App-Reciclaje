/**
 * CompleteTicketModal - Usa ConfirmModal como base
 * Caso intermedio: personaliza contenido pero usa botones estándar
 * client/src/components/tickets/CompleteTicketModal.jsx
 */

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import ConfirmModal from "../common/ConfirmModal";
import PhotoUpload from "./PhotoUpload";
import CompletionSelector from "./CompletionSelection";

export default function CompleteTicketModal({
  isOpen,
  onClose,
  onComplete,
  ticketId,
}) {
  const [photo, setPhoto] = useState(null);
  const [cleaningStatus, setCleaningStatus] = useState("complete");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (file) => {
    setPhoto(file);
    setError("");
  };

  const handleConfirm = async () => {
    if (!photo) {
      setError("Debes subir una foto para completar el ticket");
      throw new Error("Foto requerida");
    }

    setLoading(true);
    setError("");

    try {
      await onComplete(photo, cleaningStatus);
      // El componente padre maneja el cierre
    } catch (err) {
      setError(err.message || "Error al completar el ticket");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPhoto(null);
      setCleaningStatus("complete");
      setError("");
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Completar Ticket"
      icon=""
      confirmText={loading ? "Completando..." : "Completar Ticket"}
      cancelText="Cancelar"
      onConfirm={handleConfirm}
      confirmVariant="primary"
      size="medium"
      loading={loading}
      disabled={!photo}
      closeOnConfirm={false}
    >
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
        <span style={{ fontSize: "0.875rem", color: "var(--primary-dark)" }}>
          Sube una foto mostrando el área limpia y selecciona el estado de la
          limpieza
        </span>
      </div>

      {/* Upload de foto */}
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
        <PhotoUpload onPhotoChange={handlePhotoChange} error={error} />
      </div>

      {/* Selector de estado */}
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
        <CompletionSelector
          value={cleaningStatus}
          onChange={setCleaningStatus}
          disabled={loading}
        />
      </div>

      {/* Error si no hay foto */}
      {error && !photo && (
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
            marginTop: "var(--spacing-md)",
          }}
        >
          <Icon icon="fluent:error-circle-24-filled" width="20" />
          {error}
        </div>
      )}
    </ConfirmModal>
  );
}
