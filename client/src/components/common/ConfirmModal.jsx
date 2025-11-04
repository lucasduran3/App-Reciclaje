/**
 * ConfirmModal - Modal de confirmación genérico
 * Usa BaseModal como primitivo
 * client/src/components/common/ConfirmModal.jsx
 */

import React from "react";
import BaseModal, {
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "./BaseModal";
import Button from "./Button";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  // Contenido
  title = "Confirmar Acción",
  message,
  subMessage,
  children,
  icon,
  // Botones
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "primary",
  cancelVariant = "ghost",
  showCancelButton = true,
  // Comportamiento
  loading = false,
  disabled = false,
  closeOnConfirm = true,
  // Estilo
  size = "small",
  className = "",
}) {
  const handleConfirm = async () => {
    if (onConfirm) {
      try {
        await onConfirm();
        if (closeOnConfirm && !loading) {
          onClose();
        }
      } catch (err) {
        console.error("ConfirmModal error:", err);
        // No cerrar si hay error
      }
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      className={className}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <ModalHeader onClose={handleCancel} showCloseButton={!loading}>
        <ModalTitle icon={icon}>{title}</ModalTitle>
      </ModalHeader>

      <ModalBody>
        {/* Contenido por defecto */}
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
      </ModalBody>

      <ModalFooter>
        {showCancelButton && (
          <Button
            variant={cancelVariant}
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
        )}

        <Button
          variant={confirmVariant}
          onClick={handleConfirm}
          loading={loading}
          disabled={disabled || loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </BaseModal>
  );
}
