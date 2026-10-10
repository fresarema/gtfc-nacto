import { useNavigate } from 'react-router-dom';
import { clearSession } from '../../utils/auth';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Encabezado del Usuario / Inspector */}
        <header className={styles.headerCard}>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>Inspector de Terreno</h1>
            <p className={styles.userRole}>Dirección de Seguridad y Fiscalización</p>
          </div>

          <button onClick={handleLogout} className={styles.logoutButton}>
            Salir
          </button>
        </header>

        {/* Acción Principal: Crear Ticket */}
        <button onClick={() => navigate('/create-ticket')} 
        className={styles.primaryActionCard}>
          <h2 className={styles.actionTitle}>Crear Nueva Observación</h2>
          
        </button>

        {/* Acciones Secundarias */}
        <div className={styles.secondaryGrid}>
          <button 
            onClick={() => navigate('/profile')} 
            className={styles.secondaryCard}
          >
            <h3 className={styles.secondaryCardTitle}>Mi Perfil</h3>
            <p className={styles.secondaryCardSub}>Credenciales, unidad asignada y configuración.</p>
          </button>

          <div className={styles.secondaryCard} style={{ cursor: 'default', opacity: 0.8 }}>
            <h3 className={styles.secondaryCardTitle}>Tickets Recientes</h3>
            <p className={styles.secondaryCardSub}>Consulta el historial de citaciones emitidas en tu turno.</p>
          </div>
        </div>

      </div>
    </div>
  );
}