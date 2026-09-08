import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home, Package, ShoppingCart, Calendar, Users,
  BarChart, LogOut, X
} from 'lucide-react';

const menuItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/ventas', icon: ShoppingCart, label: 'Vender' },
  { to: '/pedidos', icon: Calendar, label: 'Pedidos' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/reportes', icon: BarChart, label: 'Reportes' },
];

export default function Sidebar({ onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-rosa/20 flex flex-col">
      {/* Encabezado con botón de cerrar (solo móvil) */}
      <div className="p-4 border-b border-rosa/20 flex items-center justify-between">
        <div className="text-center flex-1">
          <span className="text-3xl">🎈</span>
          <h2 className="text-base font-bold text-texto-suave">La Casa del Globo</h2>
          <p className="text-xs text-rosa-oscuro italic">Inflamos sonrisas</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-rosa/20 text-texto-suave"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Menú */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${
                isActive
                  ? 'bg-rosa/30 text-rosa-oscuro font-medium'
                  : 'text-texto-suave hover:bg-rosa/10'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-4 border-t border-rosa/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-texto-suave hover:bg-red-50 hover:text-red-400 transition-colors w-full text-sm"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}