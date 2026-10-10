import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Perfil del Fiscalizador</h2>
      <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', margin: '1rem 0', border: '1px solid #e5e7eb' }}>
        <p><strong>Nombre:</strong> Inspector Municipal</p>
        <p><strong>Rol:</strong> Fiscalizador de Terreno</p>
        <p><strong>Estado:</strong> Activo</p>
      </div>

      <button 
        onClick={() => navigate('/home')}
        style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Volver al Menú
      </button>
    </div>
  );
}