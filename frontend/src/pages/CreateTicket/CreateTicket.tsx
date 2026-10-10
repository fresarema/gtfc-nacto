import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImagePicker from "../../components/ImagePicker/ImagePicker";
import { createObservation } from "../../services/api";
import { convertFileToBase64 } from "../../utils/fileConverter";
import styles from "./CreateTicket.module.css";

function CreateTicket() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // Ubicación GPS (Inicialización perezosa para evitar llamadas a setState síncronas en useEffect)
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [locationStatus, setLocationStatus] = useState<"obteniendo" | "listo" | "error">(() =>
    "geolocation" in navigator ? "obteniendo" : "error"
  );

  const [createdAt] = useState(() => new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para alertas en pantalla
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("listo");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    // Validaciones
    if (!image) {
      setErrorMessage("Debes adjuntar una imagen como evidencia.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Debes ingresar el nombre de la incidencia.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Debes ingresar una descripción.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Convertir la imagen File a Base64
      const fotografia_b64 = await convertFileToBase64(image);

      // 2. Construir el payload exacto exigido por el Contrato #2 de la API
      const payload = {
        descripcion: `[${name.trim()}] ${description.trim()}`,
        ubicacion_observacion: {
          latitud: location.latitude,
          longitud: location.longitude,
          direccion: "Terreno GPS",
        },
        fotografia_b64,
      };

      // 3. Enviar al backend de Django
      await createObservation(payload);

      setIsSuccess(true);

      setTimeout(() => {
        setName("");
        setDescription("");
        setImage(null);
        navigate("/home");
      }, 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al registrar la observación. Inténtalo nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.createTicket}>
      <header className={styles.header}>
        <button 
          type="button" 
          onClick={() => navigate("/home")} 
          className={styles.backButton}
        >
          ← Volver al Panel
        </button>

        <div>
          <span className={styles.eyebrow}>FISCALIZADOR</span>
          <h1>Nuevo ticket</h1>
          <p>Registra una incidencia en terreno.</p>
        </div>
      </header>

      {/* Alerta de Error */}
      {errorMessage && (
        <div className={`${styles.alertBanner} ${styles.alertBannerDanger}`}>
          <span className={styles.alertIcon}>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Modal Emergente de Éxito */}
      {isSuccess && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIcon}>✓</div>
            <h3>¡Ticket enviado!</h3>
            <p>La incidencia fue registrada exitosamente.</p>
            <span className={styles.redirectBadge}>Redirigiendo al panel...</span>
          </div>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.formSection}>
          <h2>Imagen de evidencia *</h2>
          <ImagePicker onChange={setImage} />
        </section>

        <section className={styles.formSection}>
          <h2>Información *</h2>

          <div className={styles.formField}>
            <label htmlFor="name">Nombre / Título</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Comercio no autorizado"
              maxLength={100}
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe la situación encontrada..."
              maxLength={1000}
              rows={4}
            />
            <small className={styles.charCounter}>{description.length}/1000</small>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2>Ubicación</h2>
          <div className={styles.infoCard}>
            <div>
              <strong>Ubicación GPS</strong>
              {locationStatus === "obteniendo" && <p>Obteniendo coordenadas...</p>}
              {locationStatus === "listo" && (
                <p className={styles.statusSuccess}>
                  Lat: {location.latitude?.toFixed(5)}, Long: {location.longitude?.toFixed(5)}
                </p>
              )}
              {locationStatus === "error" && (
                <p className={styles.statusWarning}>Ubicación GPS no disponible.</p>
              )}
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2>Fecha y hora</h2>
          <div className={styles.infoCard}>
            <div>
              <strong>Registro automático</strong>
              <p>{new Date(createdAt).toLocaleString("es-CL")}</p>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || isSuccess}
        >
          {isSubmitting ? "Enviando ticket..." : isSuccess ? "Guardado" : "Crear ticket"}
        </button>
      </form>
    </main>
  );
}

export default CreateTicket;