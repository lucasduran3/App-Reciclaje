/**
 * CompleteTicketModal - Refactored version using reusable components
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
      throw new Error("Foto requerida"); // Evita que el modal se cierre
    }

    setLoading(true);
    setError("");

    try {
      await onComplete(photo, cleaningStatus);
      // El componente padre maneja el cierre
    } catch (err) {
      setError(err.message || "Error al completar el ticket");
      throw err; // Re-lanzar para que ConfirmModal no cierre
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title="Completar Ticket"
      icon={<Icon icon="fluent-color:checkmark-circle-48" width="24" />}
      confirmText={loading ? "Completando..." : "Completar Ticket"}
      cancelText="Cancelar"
      onConfirm={handleConfirm}
      variant="primary"
      size="modal-medium"
      loading={loading}
      disabled={!photo}
      closeOnConfirm={false} // Manejamos el cierre manualmente
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

      {/* Upload de foto usando componente reutilizable */}
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

      {/* Selector de estado de limpieza */}
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

      {/* Error adicional (si PhotoUpload no lo muestra) */}
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
