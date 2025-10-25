import React from "react";
import Button from "./Button";

export default function ConfirmModal({
  isOpen,
  onClose = () => {},
  title = "Aceptar Ticket",
  message = "¿Estás seguro que deseas aceptar este ticket?",
  subMessage = "Al aceptar, te comprometes a resolver este reporte y ganarás 20 puntos.",
  confirmText = "Sí, aceptar ticket",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  size = "modal-small",
  closeOnConfirm = true,
}) {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const handleCloseButton = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const handleConfirm = async () => {
    if (typeof onConfirm === "function") {
      try {
        // permitimos que onConfirm sea async
        await onConfirm();
      } catch (err) {
        // no ocultamos el modal si onConfirm falla; el padre puede manejar errores
        console.error("onConfirm lanzó un error:", err);
        return;
      }
    }

    if (closeOnConfirm) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal ${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={handleCloseButton}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginTop: "var(--spacing-md)",
            }}
          >
            {subMessage}
          </p>
        </div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={handleCloseButton}>
            {cancelText}
          </Button>

          <Button variant="secondary" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
