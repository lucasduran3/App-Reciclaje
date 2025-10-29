/**
 * PhotoUpload Component - Upload from file or camera
 * client/src/components/tickets/PhotoUpload.jsx
 */

import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Button from "../common/Button";

export default function PhotoUpload({ onPhotoChange, error }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const validateFile = (file) => {
    // Validar tipo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Tipo de archivo no permitido. Usa JPG, PNG o WebP");
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("La imagen excede el tamaño máximo de 5MB");
    }

    return true;
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      validateFile(file);

      // Crear preview
      const reader = new FileReader();

      reader.onload = (e) => {
        setPreview(e.target.result);
        setUploading(false);
      };

      reader.onerror = () => {
        setUploadError("Error al leer el archivo");
        setUploading(false);
      };

      reader.readAsDataURL(file);

      // Pasar el archivo al componente padre
      onPhotoChange(file);
    } catch (error) {
      setUploadError(error.message);
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    setUploadError("");
    onPhotoChange(null);

    // Resetear inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  return (
    <div className="photo-upload">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {!preview ? (
        <>
          {/* Drop Zone */}
          <div
            className={`photo-dropzone ${isDragging ? "dragging" : ""} ${
              error ? "error" : ""
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Icon
              icon="fluent-color:image-add-24"
              width="64"
              style={{ marginBottom: "var(--spacing-md)", opacity: 0.7 }}
            />
            <h4 style={{ marginBottom: "var(--spacing-sm)" }}>
              {isDragging ? "Suelta la imagen aquí" : "Sube una foto del lugar"}
            </h4>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              Arrastra y suelta, o selecciona una opción
            </p>

            <div className="upload-buttons">
              <Button
                type="button"
                variant="primary"
                onClick={handleBrowseClick}
                disabled={uploading}
                icon={<Icon icon="fluent:folder-open-24-filled" />}
              >
                Elegir Archivo
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleCameraClick}
                disabled={uploading}
                icon={<Icon icon="fluent:camera-24-filled" />}
              >
                Tomar Foto
              </Button>
            </div>

            <div
              style={{
                marginTop: "var(--spacing-lg)",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              <div>Formatos: JPG, PNG, WebP</div>
              <div>Tamaño máximo: 5MB</div>
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div
              className="error-alert"
              style={{ marginTop: "var(--spacing-md)" }}
            >
              <Icon icon="fluent:error-circle-24-filled" width="20" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Validation Error */}
          {error && (
            <div
              className="error-alert"
              style={{ marginTop: "var(--spacing-md)" }}
            >
              <Icon icon="fluent:error-circle-24-filled" width="20" />
              <span>{error}</span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Preview */}
          <div className="photo-preview">
            <img src={preview} alt="Preview" className="preview-image" />

            <div className="preview-overlay">
              <div className="preview-actions">
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleRemovePhoto}
                  icon={<Icon icon="fluent:delete-24-filled" />}
                  size="small"
                >
                  Eliminar
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBrowseClick}
                  icon={<Icon icon="fluent:arrow-swap-24-filled" />}
                  size="small"
                >
                  Cambiar
                </Button>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "var(--spacing-md)",
              padding: "var(--spacing-md)",
              background: "var(--success-light)",
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              color: "var(--success-dark)",
            }}
          >
            <Icon icon="fluent:checkmark-circle-24-filled" width="20" />
            <span>Foto cargada correctamente</span>
          </div>
        </>
      )}

      {/* Loading State */}
      {uploading && (
        <div
          style={{
            marginTop: "var(--spacing-md)",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div
            className="spinner"
            style={{ margin: "0 auto var(--spacing-sm)" }}
          />
          <span>Procesando imagen...</span>
        </div>
      )}
    </div>
  );
}
