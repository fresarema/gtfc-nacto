import { useState } from "react";
import "./ImagePicker.css";

interface ImagePickerProps {
  onChange: (file: File | null) => void;
}

function ImagePicker({ onChange }: ImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("El archivo seleccionado no es una imagen.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setPreview((previousPreview) => {
      if (previousPreview) {
        URL.revokeObjectURL(previousPreview);
      }
      return objectUrl;
    });

    onChange(file);
  };

  const handleReason = () => {
    setPreview((previousPreview) => {
      if (previousPreview) {
        URL.revokeObjectURL(previousPreview);
      }
      return null;
    });

    onChange(null);
  };

  return (
    <div className="image-picker">
      {preview ? (
        <div className="image-picker__preview-container">
          <img
            src={preview}
            alt="Vista previa del ticket"
            className="image-picker__preview"
          />
          <button
            type="button"
            className="image-picker__remove"
            onClick={handleReason}
          >
            Eliminar o cambiar foto
          </button>
        </div>
      ) : (
        <div className="image-picker__actions">
          <label className="image-picker__btn image-picker__btn--camera">
            Tomar foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleChange}
              className="image-picker__native-input"
            />
          </label>

          <label className="image-picker__btn image-picker__btn--gallery">
            Elegir de galería
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="image-picker__native-input"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default ImagePicker;