'use client';

import { useRef, useState } from 'react';

/**
 * UploadZone — zona de subida de imágenes con validación de 5 MB.
 *
 * Convierte la imagen a base64 (data URL) para almacenarla directamente
 * en la columna TEXT de Postgres. Este enfoque es válido para el volumen
 * actual del proyecto (~10 usuarios, fotos de facturas/comprobantes).
 *
 * Props:
 *   label      – texto del label (ej. "Foto de factura")
 *   value      – data URL actual (string base64 o null)
 *   onChange   – callback(dataUrl) al seleccionar una imagen válida
 *   maxMB      – tamaño máximo en MB (default: 5)
 */

const MAX_DEFAULT = 5;

export default function UploadZone({ label, value, onChange, maxMB = MAX_DEFAULT }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);

  function procesarArchivo(file) {
    if (!file) return;
    setError('');

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`El archivo excede el límite de ${maxMB} MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleFileChange(e) {
    procesarArchivo(e.target.files[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files[0];
    procesarArchivo(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setArrastrando(true);
  }

  function handleDragLeave() {
    setArrastrando(false);
  }

  function handleRemove() {
    onChange(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}

      {!value ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${arrastrando
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm text-slate-600">
            Arrastra una imagen aquí o <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Máx. {maxMB} MB — JPG, PNG, WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative inline-block">
          <img
            src={value}
            alt={label || 'Imagen subida'}
            className="max-h-44 rounded-lg border border-slate-200 shadow-sm"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md transition"
            aria-label="Eliminar imagen"
          >
            ×
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
