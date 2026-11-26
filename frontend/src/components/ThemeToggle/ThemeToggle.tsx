import { useTheme } from '../../Hooks/useTheme';
import Icon from '../Icon/Icon';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const esOscuro = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-btn"
      title={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      <Icon name={esOscuro ? 'sun' : 'moon'} />
    </button>
  );
}
