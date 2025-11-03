/**
 * CompletionSelector - Selector para estado de limpieza
 * client/src/components/tickets/CompletionSelector.jsx
 */

import React from "react";
import { Icon } from "@iconify/react";

export default function CompletionSelector({
  value,
  onChange,
  disabled = false,
}) {
  const options = [
    {
      value: "complete",
      label: "Completa",
      description: "El área fue limpiada completamente",
      icon: "fluent-color:checkmark-circle-48",
      color: "var(--success)",
    },
    {
      value: "partial",
      label: "Parcial",
      description: "Se limpió parte del área, queda trabajo pendiente",
      icon: "fluent-color:warning-24",
      color: "var(--warning)",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-sm)",
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          style={{
            padding: "var(--spacing-md)",
            border: `2px solid ${
              value === option.value ? option.color : "var(--border)"
            }`,
            borderRadius: "var(--radius)",
            background:
              value === option.value ? `${option.color}20` : "var(--surface)",
            cursor: disabled ? "not-allowed" : "pointer",
            textAlign: "left",
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-sm)",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Icon
            icon={option.icon}
            width="24"
            style={{ color: option.color, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
              {option.label}
            </div>
            <div
              style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}
            >
              {option.description}
            </div>
          </div>
          {value === option.value && (
            <Icon
              icon="fluent:checkmark-24-filled"
              width="20"
              style={{ color: option.color }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
