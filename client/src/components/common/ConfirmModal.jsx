import React from "react";
import Button from "./Button";

export default function ConfirmModal({
  isOpen,
  onClose = () => {},
  title = "Confirmar Acción",
  message,
  subMessage,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  size = "modal-small",
  closeOnConfirm = true,
  variant = "secondary",
  icon,
  loading = false,
  disabled = false,
  children,
}) {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (loading) return; // No cerrar si está cargando
    if (onCancel) onCancel();
    onClose();
  };

  const handleCloseButton = () => {
    if (loading) return;
    if (onCancel) onCancel();
    onClose();
  };

  const handleConfirm = async () => {
    if (typeof onConfirm === "function") {
      try {
        await onConfirm();
      } catch (err) {
        console.error("onConfirm error:", err);
        return; // No cerrar si hay error
      }
    }

    if (closeOnConfirm && !loading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal ${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {icon && (
              <span style={{ marginRight: "var(--spacing-sm)" }}>{icon}</span>
            )}
            {title}
          </h2>
          <button
            className="modal-close"
            onClick={handleCloseButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Contenido por defecto (mensaje + submensaje) */}
          {!children && (
            <>
              {message && <p>{message}</p>}
              {subMessage && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    marginTop: "var(--spacing-md)",
                  }}
                >
                  {subMessage}
                </p>
              )}
            </>
          )}

          {/* Contenido personalizado */}
          {children}
        </div>

        <div className="modal-footer">
          <Button
            variant="ghost"
            onClick={handleCloseButton}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={loading}
            disabled={disabled || loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
