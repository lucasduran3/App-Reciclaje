/**
 * ValidateTicketModal - Modal para validar o rechazar un ticket
 * client/src/components/tickets/ValidateTicketModal.jsx
 */

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import ConfirmModal from "../common/ConfirmModal";

export default function ValidateTicketModal({
  isOpen,
  onClose,
  onValidate,
  ticketId,
}) {
  const [validationMessage, setValidationMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState(null); // 'approve' o 'reject'

  const handleApprove = () => {
    setAction("approve");
    handleConfirm(true);
  };

  const handleReject = () => {
    setAction("reject");
    handleConfirm(false);
  };

  const handleConfirm = async (approved) => {
    // Validar mensaje si es necesario
    if (validationMessage.length > 200) {
      setError("El mensaje no puede exceder 200 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onValidate(approved, validationMessage);
      // El componente padre maneja el cierre y feedback
    } catch (err) {
      setError(err.message || "Error al procesar validación");
      setLoading(false);
      throw err; // Re-lanzar para evitar cierre del modal
    }
  };

  const handleClose = () => {
    if (loading) return;
    setValidationMessage("");
    setError("");
    setAction(null);
    onClose();
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Validar Limpieza"
      icon=""
      confirmText="Cerrar"
      onConfirm={handleClose}
      size="modal-medium"
      closeOnConfirm={true}
    >
      {/* Instrucciones */}
      <div
        style={{
          padding: "var(--spacing-md)",
          background: "var(--info-light, #dbeafe)",
          borderRadius: "var(--radius)",
          marginBottom: "var(--spacing-lg)",
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--spacing-sm)",
        }}
      >
        <Icon
          icon="fluent-color:info-24"
          width="20"
          style={{ flexShrink: 0, marginTop: "2px" }}
        />
        <div style={{ fontSize: "0.875rem", color: "var(--text)" }}>
          <strong>Revisa las fotos antes y después.</strong>
          <br />
          Al aprobar, confirmas que la limpieza se realizó correctamente.
          <br />
          Al rechazar, el ticket volverá a estar disponible para que otro
          usuario lo tome.
        </div>
      </div>

      {/* Campo de mensaje opcional */}
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <label
          style={{
            display: "block",
            marginBottom: "var(--spacing-sm)",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          Mensaje de validación (opcional)
        </label>
        <textarea
          value={validationMessage}
          onChange={(e) => setValidationMessage(e.target.value)}
          placeholder="Agrega un comentario sobre la limpieza realizada..."
          rows={3}
          maxLength={200}
          style={{
            width: "100%",
            padding: "var(--spacing-md)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            fontFamily: "inherit",
            fontSize: "0.875rem",
            resize: "vertical",
          }}
          disabled={loading}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "var(--spacing-xs)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          <span>{validationMessage.length}/200 caracteres</span>
          {error && <span style={{ color: "var(--danger)" }}>{error}</span>}
        </div>
      </div>

      {/* Botones de acción */}
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-md)",
          marginTop: "var(--spacing-xl)",
        }}
      >
        <button
          type="button"
          onClick={handleReject}
          disabled={loading}
          style={{
            flex: 1,
            padding: "var(--spacing-md) var(--spacing-lg)",
            background: "var(--danger)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius)",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
          }}
          onMouseOver={(e) => {
            if (!loading)
              e.currentTarget.style.background = "var(--danger-dark)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--danger)";
          }}
        >
          <Icon icon="fluent:dismiss-circle-24-filled" width="20" />
          {loading && action === "reject" ? "Rechazando..." : "Rechazar"}
        </button>

        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          style={{
            flex: 1,
            padding: "var(--spacing-md) var(--spacing-lg)",
            background: "var(--success)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius)",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.background = "#059669";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--success)";
          }}
        >
          <Icon icon="fluent:checkmark-circle-24-filled" width="20" />
          {loading && action === "approve" ? "Aprobando..." : "Aprobar"}
        </button>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div
          style={{
            marginTop: "var(--spacing-md)",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
          }}
        >
          <div
            className="spinner"
            style={{
              width: "20px",
              height: "20px",
              margin: "0 auto var(--spacing-sm)",
            }}
          />
          Procesando validación...
        </div>
      )}
    </ConfirmModal>
  );
}
