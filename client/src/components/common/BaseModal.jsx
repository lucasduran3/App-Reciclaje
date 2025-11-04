/**
 * BaseModal - Componente primitivo de modal
 * Provee estructura básica sin lógica de negocio
 * client/src/components/common/BaseModal.jsx
 */

import React, { useEffect } from "react";

export default function BaseModal({
  isOpen,
  onClose,
  size = "medium",
  className = "",
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: "modal-small",
    medium: "modal-medium",
    large: "modal-large",
    fullscreen: "modal-fullscreen",
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className={`modal ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Sub-componentes para composición
 */

export function ModalHeader({ children, onClose, showCloseButton = true }) {
  return (
    <div className="modal-header">
      {children}
      {showCloseButton && (
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      )}
    </div>
  );
}

export function ModalTitle({ icon, children }) {
  return (
    <h2 className="modal-title">
      {icon && <span style={{ marginRight: "var(--spacing-sm)" }}>{icon}</span>}
      {children}
    </h2>
  );
}

export function ModalBody({ children, className = "" }) {
  return <div className={`modal-body ${className}`}>{children}</div>;
}

export function ModalFooter({ children, align = "right" }) {
  const alignStyles = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
    space: "space-between",
  };

  return (
    <div
      className="modal-footer"
      style={{ justifyContent: alignStyles[align] }}
    >
      {children}
    </div>
  );
}
